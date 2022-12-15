extern crate hex;

// **WARNING** It's not obvious that we want to have our tests in a separate file, possibly we want these in the end of each file.

#[cfg(all(test, not(target_arch = "wasm32")))]
mod tests {
    use crate::*;
    use near_sdk::test_utils::VMContextBuilder;
    use near_sdk::{testing_env, log};

    const _STORAGE_COST: SalePriceInYoctoNear = U128(16_420_000_000_000_000_000_000);

    // simple helper function to take a string literal and return a ValidAccountId
    fn to_valid_account(account: &str) -> AccountId {
        //ValidAccountId::try_from(account.to_string()).expect("Invalid account")
        let result: AccountId = AccountId::new_unchecked(account.to_string());
        result
    }

    fn get_context(deposit: Balance) -> VMContextBuilder {
        let mut builder = VMContextBuilder::new();
        builder.predecessor_account_id(to_valid_account("carol.near"));                     // Carol will mint. During most of the tests, we will change this to Alice
        builder.signer_account_id(to_valid_account("carol.near"));                          // --
        builder.current_account_id(to_valid_account("vault.near"));                         // Owner is Vault
        builder.attached_deposit(deposit);
        builder
    }

    fn test_token_metadata() -> TokenMetadata {
        TokenMetadata {
            title: Some("TestNFT".to_string()),
            description: Some("This is the description".to_string()),
            extra: Some("{\"music_cid\":\"QmU51uX3B44Z4pH2XimaJ6eScRgAzG4XUrKfsz1yWVCo6f\",\"music_hash\":\"OTZlOGViMTQyMTZkMDNhODEzMWVkOGM1NjFhODJhZjI1ZGFmNTc4NmI1M2RlNGUzMDRiMTMzZmUwMTRlYWY4ZA==\",\"original_price\":\"0\",\"instance_nonce\":0,\"generation\":1}".to_string()),
            media: Some("QmYdCeRFUwEEAKpr2y86DyLiAmLEX5m7ZD8qqWfNuvarZf".to_string()),
            media_hash: None,
            copies: None,
            expires_at: None,
            issued_at: None,
            reference: None,
            reference_hash: None,
            starts_at: None,
            updated_at: None
        }
    }

    fn test_json_token_vault(token_metadata: TokenMetadata) -> JsonToken {
        JsonToken {
            token_id: "fono-root-0-0".to_string(),
            owner_id: to_valid_account("vault.near"),
            metadata: token_metadata,
            approved_account_ids: HashMap::new(),
        }
    }

    fn test_nft_list() -> Vec<JsonToken> {
        let mut list = Vec::new();
        list.push(JsonToken {
            token_id: "fono-root-0".to_string(),
            owner_id: to_valid_account("carol.near"),
            metadata: test_token_metadata(),
            approved_account_ids: HashMap::new(),
        });
        list.push(JsonToken {
            token_id: "fono-root-0-0".to_string(),
            owner_id: to_valid_account("vault.near"),
            metadata: test_token_metadata(),
            approved_account_ids: HashMap::new(),
        });
        list.push(JsonToken {
            token_id: "fono-root-0-1".to_string(),
            owner_id: to_valid_account("vault.near"),
            metadata: test_token_metadata(),
            approved_account_ids: HashMap::new(),
        });

        list
    }

    fn test_nft_contract_metadata() -> NFTContractMetadata {
        NFTContractMetadata {
            spec: "nft-1.0.0".to_string(),
            name: "Fono Root".to_string(),
            symbol: "FONO".to_string(),
            icon: None,
            base_uri: None,
            reference: None,
            reference_hash: None
        }
    }




  


    #[test]
    fn enumeration_nft_tokens_works() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
      
        let token_metadata = test_token_metadata();

        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // should create 3 NFTs

        assert_eq!(
            contract.nft_tokens(None, Some(500)).len(), 
            3, 
            "Length of vector returned from nft_tokens() should be 3!"
        );

        assert_eq!(contract.nft_tokens(None, Some(500))[0].token_id, test_nft_list()[0].token_id, "Returned token_id is not correct!");
        assert_eq!(contract.nft_tokens(None, Some(500))[1].token_id, test_nft_list()[1].token_id, "Returned token_id is not correct!");
        assert_eq!(contract.nft_tokens(None, Some(500))[2].token_id, test_nft_list()[2].token_id, "Returned token_id is not correct!");

        assert_eq!(contract.nft_tokens(None, Some(500))[0].owner_id, test_nft_list()[0].owner_id, "Returned owner_id is not correct!");
        assert_eq!(contract.nft_tokens(None, Some(500))[1].owner_id, test_nft_list()[1].owner_id, "Returned owner_id is not correct!");
        assert_eq!(contract.nft_tokens(None, Some(500))[2].owner_id, test_nft_list()[2].owner_id, "Returned owner_id is not correct!");
    }

// **WARNING** We don't know how to modify this now that `buy_nft_from_vault` is not in this contract anymore.
/*

    #[test]
    fn enumeration_nft_supply_for_owner_works() {
        let mut context = get_context(600_000_000_000_000_000_000_000);                                                       // Alice sends 0.6 NEAR
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
      
        let token_metadata = test_token_metadata();

        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // Carol should have 1 NFT
        context.predecessor_account_id(to_valid_account("alice.near"));                                                       // Alice interacts with the contract
        context.signer_account_id(to_valid_account("alice.near"));
        testing_env!(context.build());

        contract.buy_nft_from_vault("fono-root-0-0".to_string());                                                             // Alice bought 1 NFT
        contract.buy_nft_from_vault("fono-root-0-1".to_string());                                                             // Alice bought 1 more NFT

        assert_eq!(
            contract.nft_supply_for_owner(to_valid_account("carol.near")),
            U128(1),
            "At this point, Carol should have 1 NFT!"
        );

        assert_eq!(
            contract.nft_supply_for_owner(to_valid_account("alice.near")),
            U128(2),
            "At this point Alice should have 2 NFTs!"
        );

        assert_eq!(
            contract.nft_supply_for_owner(to_valid_account("vault.near")),
            U128(4),
            "At this point, there should be 4 NFTs in the Vault!"
        );

        assert_eq!(
            contract.nft_supply_for_owner(to_valid_account("nobody.near")),
            U128(0),
            "At this point, this address shouldn't have any NFTs"
        );
    }
*/
    #[test]
    fn enumeration_nft_tokens_for_owner_works() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
      
        let token_metadata = test_token_metadata();

        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // should create 3 NFTs

        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("carol.near"), None, Some(500)).len(), 
            1, 
            "Length of vector returned from nft_tokens() should be!"
        );

        assert_eq!(contract.nft_tokens(None, Some(500))[0].token_id, test_nft_list()[0].token_id, "Returned token_id is not correct!");
        assert_eq!(contract.nft_tokens(None, Some(500))[0].owner_id, test_nft_list()[0].owner_id, "Returned owner_id is not correct!");
    }
// **WARNING** We don't know how to modify this now that `buy_nft_from_vault` is not in this contract anymore.
/*
    #[test]
    fn can_calculate_next_buyable() {
        let mut context = get_context(600_000_000_000_000_000_000_000);                                                           // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
      
        let token_metadata = test_token_metadata();

        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // First generation created
        let next_buyable = contract.get_next_buyable("fono-root-0".to_string());
        assert_eq!(next_buyable, "fono-root-0-0", "Next buyable item should be fono-root-0-0!");

        context.predecessor_account_id(to_valid_account("alice.near"));                                                       // Alice interacts with the contract
        context.signer_account_id(to_valid_account("alice.near"));
        testing_env!(context.build());

        contract.buy_nft_from_vault("fono-root-0-0".to_string());                                                             // There is still one gen-1 token to buy after this
        let next_buyable = contract.get_next_buyable("fono-root-0".to_string());
        assert_eq!(next_buyable, "fono-root-0-1", "Next buyable item should be fono-root-0-1!");


        contract.buy_nft_from_vault("fono-root-0-1".to_string());                                                             // Now gen-1 is out, gen-2 is next
        let next_buyable = contract.get_next_buyable("fono-root-0".to_string());
        assert_eq!(next_buyable, "fono-root-0-2", "Next buyable item should be fono-root-0-2!");
    }
*/
    #[test]
    fn get_root_works() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin

        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));

        assert_eq!(contract.get_root("fono-root-0-0".to_string()), "fono-root-0", "Root for this NFT should be fono-root-0!");
        assert_eq!(contract.get_root("fono-root-1-1".to_string()), "fono-root-1", "Root for this NFT should be fono-root-1!");
        assert_eq!(contract.get_root("fono-root-2-0".to_string()), "fono-root-2", "Root for this NFT should be fono-root-2!");
        assert_eq!(contract.get_root("fono-root-0-0".to_string()), "fono-root-0", "Root for this NFT should be fono-root-0!");
    }

    #[test]
    fn sha256_works() {
        let id = to_valid_account("alice.near");
        log!("AccountId {:?}", id.as_bytes());
        log!("String {:?}", "alice.near".as_bytes());
        
        assert_eq!(
            format!("{:?}", hash_account_id(&to_valid_account("alice.near"))),
            format!("{:?}", hex::decode("2DD5DDA540767B3A1AA33544BCBA38042F4DF6DE9BDDB46798B29481C842C558").expect("Decoding failed")),
            "SHA256 value for alice.near is not correct!"
        );
    }

    #[test]
    fn byte_calculation_works() {
        assert_eq!(
            bytes_for_approved_account_id(&to_valid_account("alice.near")),
            22,
            "Byte length for alice.near should be 22!"
        );
    }



    /*#[test]
    fn refund_deposit_after_mint_works() {
        let context = get_context(600_000_000_000_000_000_000_000);                                                           // Alice sends 0.6 NEAR. ~0.075 NEAR should be refunded.
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin

        let before_refund = env::account_balance();
        log!("{:?}", env::account_balance());
        contract.mint_root(test_token_metadata(), to_valid_account("alice.near"));
        log!("{:?}", env::account_balance());
        assert_eq!(
            env::account_balance(),
            before_refund - 723800000000000000000000, 
            "0.07238 NEAR should have been refunded"
        );
    }*/

    #[test]
    fn add_token_to_owner_works() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin

        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));

        contract.internal_add_token_to_owner(&to_valid_account("alice.near"), &"fono-root-0-0".to_string());
        assert_eq!( 
            contract.tokens_per_owner.contains_key(&to_valid_account("alice.near")),
            true,
            "alice.near should have been added to the set!"
        );
        contract.internal_add_token_to_owner(&to_valid_account("alice.near"), &"fono-root-0-1".to_string());
        assert_eq!(
            contract.nft_supply_for_owner(to_valid_account("alice.near")),
            U128(2),
            "alice.near should have 2 NFTs!"
        );
    }

    #[test]
    fn remove_token_from_owner_works() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin

        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));

        contract.internal_add_token_to_owner(&to_valid_account("alice.near"), &"fono-root-0-0".to_string());
        contract.internal_add_token_to_owner(&to_valid_account("alice.near"), &"fono-root-0-1".to_string());
        contract.internal_remove_token_from_owner(&to_valid_account("alice.near"), &"fono-root-0-1".to_string());
        assert_eq!(
            contract.nft_supply_for_owner(to_valid_account("alice.near")),
            U128(1),
            "alice.near should have 1 NFTs!"
        );
        contract.internal_remove_token_from_owner(&to_valid_account("alice.near"), &"fono-root-0-0".to_string());
        assert_eq!( 
            contract.tokens_per_owner.contains_key(&to_valid_account("alice.near")),
            false,
            "alice.near should have been removed from the set!"
        );
    }

    #[test]
    fn internal_transfer_works() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin

        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));

        // Carol will transfer the RootNFT to Alice
        contract.internal_transfer(
            &to_valid_account("carol.near"), 
            &to_valid_account("alice.near"), 
            &"fono-root-0".to_string(), 
            None, 
            None,
        );

        assert_eq!( 
            contract.tokens_per_owner.contains_key(&to_valid_account("carol.near")),
            false,
            "carol.near shouldn't have any NFTs at this point!"
        );

        assert_eq!( 
            contract.nft_tokens_for_owner(to_valid_account("alice.near"), None, Some(10))[0].token_id,
            test_nft_list()[0].token_id,
            "Alice should own fono-root-0 at this point!"
        );
    }

    #[test]
    fn nft_metadata_getter_works() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
      
        log!("{:?}", contract.nft_metadata());
        assert_eq!(contract.nft_metadata().spec, test_nft_contract_metadata().spec, "nft_metadata() does not give back correct 'spec'");
        assert_eq!(contract.nft_metadata().symbol, test_nft_contract_metadata().symbol, "nft_metadata() does not give back correct 'symbol'");
        assert_eq!(contract.nft_metadata().name, test_nft_contract_metadata().name, "nft_metadata() does not give back correct 'name'");
    }

    #[test]
    fn mint_root_creates_new() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
  
        let token_metadata = test_token_metadata();

        assert_eq!(
            contract.nft_tokens(None, Some(500)).len(), 
            0, 
            "NFT count before mint should be zero!"
        );

        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // fono-root-0, fono-root-0-0, fono-root-0-1 should exist at this point
        assert_eq!(
            contract.tokens_by_id.contains_key(&"fono-root-0".to_string()),
            true,
            "RootNFT should exist (fono-root-0)!"
        );
    }
    
    #[test]
    fn mint_root_nonce_increses() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        let token_metadata = test_token_metadata();
        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // fono-root-0, fono-root-0-0, fono-root-0-1 should exist at this point
        
        assert_eq!(
            contract.root_nonce,
            1,
            "mint_root() should increase root_nonce by 1!"
        );
    }

    #[test]
    fn mint_root_creates_exactly_2_children() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        let token_metadata = test_token_metadata();
        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // fono-root-0, fono-root-0-0, fono-root-0-1 should exist at this point
        
        assert_eq!(
            contract.nft_tokens(None, Some(500)).len(), 
            3,
            "mint_root() should create exactly 2 children!"
        );
    }

    #[test]
    fn mint_root_nft_goes_to_receiver() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        let token_metadata = test_token_metadata();
        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // fono-root-0, fono-root-0-0, fono-root-0-1 should exist at this point
        
        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("carol.near"), None, Some(10))[0].owner_id,
            test_nft_list()[0].owner_id,
            "RootNFT should go to receiver_id!"
        );
    }

    #[test]
    fn mint_root_two_nfts_go_to_vault() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        let token_metadata = test_token_metadata();
        contract.mint_root(token_metadata, to_valid_account("carol.near"));                                                   // fono-root-0, fono-root-0-0, fono-root-0-1 should exist at this point
        
        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("vault.near"), None, Some(10))[0].owner_id,
            test_nft_list()[1].owner_id,
            "2 NFTs should go to Vault!"
        );
        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("vault.near"), None, Some(10))[1].owner_id,
            test_nft_list()[2].owner_id,
            "2 NFTs should go to Vault!"
        );
    }

    #[test]
    fn mint_root_token_id_is_correct() {
        let context = get_context(50_000_000_000_000_000_000_000);
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));

        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("carol.near"), None, Some(10))[0].token_id,
            "fono-root-0",
            "First token_id that Carol owns should be fono-root-0!"
        );
        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("carol.near"), None, Some(10))[1].token_id,
            "fono-root-1",
            "First token_id that Carol owns should be fono-root-1!"
        );
        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("carol.near"), None, Some(10))[2].token_id,
            "fono-root-2",
            "First token_id that Carol owns should be fono-root-2!"
        );
    }

    #[test]
    #[should_panic]
    fn mint_root_only_admin() {
        let mut context = get_context(50_000_000_000_000_000_000_000);                                                        // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        context.predecessor_account_id(to_valid_account("alice.near"));                                                       // Alice interacts with the contract
        context.signer_account_id(to_valid_account("alice.near"));
        testing_env!(context.build());
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
    }

    #[test]
    fn create_children_creates_exactly_2_children() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));

        let supply_before = contract.nft_tokens(None, Some(500)).len();
        contract.create_children("fono-root-0".to_string(), "fono-root-0-1".to_string());
        assert_eq!(
            contract.nft_tokens(None, Some(500)).len(),
            supply_before + 2,
            "create_children should create exactly 2 new NFTs!"
        );
    }

    #[test]
    fn create_children_ids_are_correct() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.create_children("fono-root-0".to_string(), "fono-root-0-1".to_string());
        
        assert_eq!(
            contract.nft_tokens(None, Some(500))[3].token_id,
            "fono-root-0-2",
            "The token ID for the newly created NFT is not correct!"
        );
        assert_eq!(
            contract.nft_tokens(None, Some(500))[4].token_id,
            "fono-root-0-3",
            "The token ID for the newly created NFT is not correct!"
        );
    } 
    
    #[test]
    fn create_children_generation_is_correct() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.create_children("fono-root-0".to_string(), "fono-root-0-1".to_string());

        let metadata = contract.token_metadata_by_id.get(&"fono-root-0-2".to_string()).unwrap();
        let extra: Extra = serde_json::from_str(&metadata.extra.unwrap()).unwrap();
        assert_eq!(
            extra.generation,
            3,
            "Generation value for the newly created token is not correct!"
        );
        let metadata = contract.token_metadata_by_id.get(&"fono-root-0-3".to_string()).unwrap();
        let extra: Extra = serde_json::from_str(&metadata.extra.unwrap()).unwrap();
        assert_eq!(
            extra.generation,
            3,
            "Generation value for the newly created token is not correct!"
        );
    }

    #[test]
    fn create_children_parent_is_correct() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.create_children("fono-root-0".to_string(), "fono-root-0-1".to_string());

        let metadata = contract.token_metadata_by_id.get(&"fono-root-0-2".to_string()).unwrap();
        let extra: Extra = serde_json::from_str(&metadata.extra.unwrap()).unwrap();
        assert_eq!(
            extra.parent,
            Some("fono-root-0-1".to_string()),
            "Parent field for the newly created token is not correct!"
        );
        let metadata = contract.token_metadata_by_id.get(&"fono-root-0-3".to_string()).unwrap();
        let extra: Extra = serde_json::from_str(&metadata.extra.unwrap()).unwrap();
        assert_eq!(
            extra.parent,
            Some("fono-root-0-1".to_string()),
            "Parent field for the newly created token is not correct!"
        );
    }

    #[test]
    fn create_children_instance_nonce_increased() {
        let context = get_context(50_000_000_000_000_000_000_000);                                                            // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        contract.create_children("fono-root-0".to_string(), "fono-root-0-1".to_string());

        let metadata = contract.token_metadata_by_id.get(&"fono-root-0".to_string()).unwrap();
        let extra: Extra = serde_json::from_str(&metadata.extra.unwrap()).unwrap();

        assert_eq!(
            extra.instance_nonce,
            4,
            "Instance nonce was not increased when create_children ran or it didn't increase with right amount!"
        );
    }

    #[test]
    fn transfer_nft_works() {
        let mut context = get_context(600_000_000_000_000_000_000_000);                                                       // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        testing_env!(context.build());

        contract.transfer_nft("fono-root-0".to_string(), to_valid_account("alice.near"));

        assert_eq!(
            contract.nft_tokens_for_owner(to_valid_account("alice.near"), None, Some(10))[0].token_id,
            "fono-root-0",
            "Bob should own fono-root-0!"
        );
    }

    #[test]
    #[should_panic]
    fn transfer_nft_only_owner() {
        let mut context = get_context(600_000_000_000_000_000_000_000);                                                       // Alice is person who interacts
        testing_env!(context.build());
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));        // Vault is owner, Carol will be admin
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"));
        // Carol will transfer the RootNFT to Alice
        contract.internal_transfer(
            &to_valid_account("carol.near"), 
            &to_valid_account("alice.near"), 
            &"fono-root-0".to_string(), 
            None, 
            None,
        );
        context.predecessor_account_id(to_valid_account("alice.near"));                                                       // Alice interacts with the contract
        context.signer_account_id(to_valid_account("alice.near"));
        testing_env!(context.build());

        contract.transfer_nft("fono-root-0-0".to_string(), to_valid_account("bob.near"));
    }







    /*#[test]
    fn accounts_on_revenue_table_are_paid_out() {
        let mut context = get_context(600_000_000_000_000_000_000_000);                                                       // Alice is person who interacts
        testing_env!(context.build());
        
        let mut contract = Contract::new_default_meta(to_valid_account("vault.near"), to_valid_account("carol.near"));       // Vault is owner, Carol will be admin
        let price = U128(500_000_000_000_000_000_000_000);
        
        contract.mint_root(test_token_metadata(), to_valid_account("carol.near"), price.clone(), None,
            Some(HashMap::from([                                                                                            // Alice: 20%
                (to_valid_account("alice.near"), 2000),                                                                     // Vault: 80%
                (to_valid_account("vault.near"), 8000)
                ]))
            );
        
        log!("caller: {:?}", env::current_account_id());
        log!("Alice balance: {:?}", env::account_balance());
        context.predecessor_account_id(to_valid_account("bob.near"));                                                       // Bob interacts with the contract
        context.signer_account_id(to_valid_account("bob.near"));
        //testing_env!(context.build());
        contract.buy_nft_from_vault("fono-root-0-0".to_string());

        context.predecessor_account_id(to_valid_account("alice.near"));                                                       // Bob interacts with the contract
        context.signer_account_id(to_valid_account("alice.near"));
        log!("caller: {:?}", env::current_account_id());
        log!("Alice balance: {:?}", env::account_balance());


        // We need to check account balances
        // for Alice and Vault
        // 20% is 100_000_000_000_000_000_000_000
        // 80% is 400_000_000_000_000_000_000_000
    }*/

}