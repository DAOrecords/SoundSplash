use crate::*;

// **WARNING** It is not sure that we will do the `create_children` at mint/buy, but if the money
// will be handled outside this contract, this could make sense, because this way the 'BUY' action could be basically a transfer,
// where the NFT is transfered from the Mother Contract (FonoRoot-DAO / modified Sputnik) to the person who buys it.
// !! We will modify the contract, so it connects well with tha MotherContract (modified SputnikDAO)

#[near_bindgen]
impl Contract {
    /// `mint_root` will mint a new root NFT, that has a unique music attached to it (IPFS CID),
    /// will automatically mint 2 children. The root NFT goes to `receiver_id`, the 2 children go to Vault.
    #[payable]
    pub fn mint_root(
        &mut self,
        metadata: TokenMetadata,
        receiver_id: AccountId,
    ) {
        log!("Starting MintRoot...");

        assert_eq!(
            self.admin, 
            env::predecessor_account_id(),
            "Only admin can mint new Root-NFTs!"
        );

        let initial_storage_usage = env::storage_usage();                                       // Take note of initial storage usage for refund

        let token_id = "fono-root-".to_string() + &self.root_nonce.to_string();                // We generate the ID for the RootNFT. The RootNFT ID only has 1 number in it, like fono-root-22
        self.root_nonce = self.root_nonce + 1;                                                 // We increment nonce to avoid collision

        let token = Token {
            owner_id: receiver_id,
            approved_account_ids: Default::default(),
            next_approval_id: 0,
        };

        assert!(
            self.tokens_by_id.insert(&token_id, &token).is_none(),
            "Token already exists!"
        );


        // Although `instance_nonce` is sent from front-end, we make sure that it's value is 0
        // **WARNING** This needs to be changed, because some of this will be inside `reference` instead of `extra`
        // and also, we don't store price inside the NFT! Some of this logic will be moved to the Mother Contract.
        // **WARNING** That's also a thing, that the JSON object on IPFS has to exist before we do the minting, this was not the case before.
        let mut modified_metadata = metadata;
        let mut extra_obj: Extra = serde_json::from_str(&modified_metadata.extra.unwrap()).unwrap();
        extra_obj.instance_nonce = 0;
        extra_obj.generation = 1;                                                               // The Root NFT is the first generation
        modified_metadata.extra = Some(serde_json::to_string(&extra_obj).unwrap());

        self.token_metadata_by_id.insert(&token_id, &modified_metadata);                        // Insert new NFT
        self.internal_add_token_to_owner(&token.owner_id, &token_id);

        let nft_mint_log: EventLog = EventLog {                                                 // Construct the mint log as per the events standard.
            standard: NFT_STANDARD_NAME.to_string(),
            version: NFT_METADATA_SPEC.to_string(),
            event: EventLogVariant::NftMint(vec![NftMintLog {
                owner_id: token.owner_id.to_string(),
                token_ids: vec![token_id.to_string()],
                memo: None,
            }]),
        };

        env::log_str(&nft_mint_log.to_string());                                                // Log the serialized json.

        self.create_children(token_id.clone(), token_id);                                       // This has to happen before the refund

        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
        refund_deposit(required_storage_in_bytes);                                              // Refund not-used storage
    }


    /// 'create_children' will mint 2 new NFTs and put them to the Vault
    /// * `token_id` is id of the new token this should be probably generated from inside the contract as well
    /// * `parent` id of the parent NFT
    pub(crate) fn create_children( // remove (crate)
        &mut self,
        root: TokenId,
        parent: TokenId,
    ) {
        log!("Starting create_children...");
        
        for child_num in 0..2 {
            log!("Entering loop (create children)...{}", child_num);
            
            // We create the token_id. For this, we need the meta of the root NFT. We need to increment nonce
            let mut root_metadata = self.token_metadata_by_id.get(&root.to_owned()).unwrap();
            // **WARNING** This needs to be changed, but probably it will be easier, not more complicated
            let mut root_extra_obj: Extra = serde_json::from_str(&root_metadata.extra.unwrap()).unwrap();
            // **WARNING** Probably we should use the `copies` field!
            let token_id = root.clone().to_owned() + &"-".to_string() + &root_extra_obj.instance_nonce.to_string();

            let mut metadata = self.token_metadata_by_id.get(&parent.to_owned()).unwrap();      // Current NFT meta
            let mut extra_obj: Extra = serde_json::from_str(&metadata.extra.unwrap()).unwrap();
            
            extra_obj.parent =  Some(parent.clone());                                           // We write the parent to the current NFT extra
            
            // **WARNING** If Gen1 can be purchased, all of this logic will change!
            if extra_obj.generation == 1 {                                                      // If called from mint_root()
                extra_obj.generation = 2; 
            } else if root_extra_obj.instance_nonce > (u32::checked_pow(2, extra_obj.generation).unwrap() -3) {
                extra_obj.generation = extra_obj.generation + 1;                                // 2^Gen-3 is the LastIndex in a generation
            }
              
            metadata.extra = Some(serde_json::to_string(&extra_obj).unwrap());                  // Insert modified metadata into meta field
            //env::log_str(&serde_json::to_string(&extra_obj).unwrap());
        
            // **WARNING** Probably do this with `copies`.
            root_extra_obj.instance_nonce = root_extra_obj.instance_nonce + 1;                  // We increment instance_nonce
            root_metadata.extra = Some(serde_json::to_string(&root_extra_obj).unwrap());
            self.token_metadata_by_id.insert(&root, &root_metadata);                            // Insert back the updated root meta
            //env::log_str(&serde_json::to_string(&root_extra_obj).unwrap());

            let token = Token {
                owner_id: env::current_account_id(),
                approved_account_ids: Default::default(),                                       // This is an individual NFT, all the values should start with 0,
                next_approval_id: 0,                                                            // just like in the Root
            };
    
            assert!(
                self.tokens_by_id.insert(&token_id, &token).is_none(),
                "Token already exists!"
            );
    
            
            
            self.token_metadata_by_id.insert(&token_id, &metadata);                             // Insert new NFT
            self.internal_add_token_to_owner(&token.owner_id, &token_id);                       // &token.owner_id will refer to self (contract)
            
            let nft_mint_log: EventLog = EventLog {                                             // Construct the mint log as per the events standard.
                standard: NFT_STANDARD_NAME.to_string(),                                        // same as with Root
                version: NFT_METADATA_SPEC.to_string(),
                event: EventLogVariant::NftMint(vec![NftMintLog {
                    owner_id: token.owner_id.to_string(),
                    token_ids: vec![token_id.to_string()],
                    memo: None,
                }]),
            };
            
            env::log_str(&nft_mint_log.to_string());                                            // Log the serialized json.    
        }
        log!("Exiting create_children...");
    }
}