use crate::*;
use near_sdk::{
    log
};

#[near_bindgen]
impl Contract {
    /// Query for NFT tokens on the contract regardless of the owner using pagination
    pub fn nft_tokens(&self, from_index: Option<U128>, limit: Option<u64>) -> Vec<JsonToken> {
        let keys = self.token_metadata_by_id.keys_as_vector();

        let start = u128::from(from_index.unwrap_or(U128(0)));                              // Start from `from_index` or 0

        keys.iter()
            .skip(start as usize) 
            .take(limit.unwrap_or(0) as usize)                                              // Take `limit` elements (or 0)
            .map(|token_id| self.nft_token(token_id.clone()).unwrap())
            .collect()
    }

    /// Query for list of NFT tokens on the contract, based on a list of TokenId that was provided as a parameter
    pub fn nft_token_details_for_list(&self, token_list: Vec<TokenId>) -> Vec<JsonToken> {  // **WARNING** we don't have a test for this!
        let mut result = Vec::new();

        for i in 0..token_list.len() {
            result.push(self.nft_token(token_list[i].clone()).unwrap());
        }
        
        result
    }

    /// Get the total supply of NFTs for a given owner (a number)
    pub fn nft_supply_for_owner(
        &self,
        account_id: AccountId,
    ) -> U128 {
        let tokens_for_owner_set = self.tokens_per_owner.get(&account_id);
    
        if let Some(tokens_for_owner_set) = tokens_for_owner_set {
            U128(tokens_for_owner_set.len() as u128)
        } else {
            U128(0)
        }
    }

    /// Query for all the tokens for an owner
    pub fn nft_tokens_for_owner(
        &self,
        account_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>,
    ) -> Vec<JsonToken> {
        let tokens_for_owner_set = self.tokens_per_owner.get(&account_id);                 // Get the set of tokens for the passed in owner
        let tokens = if let Some(tokens_for_owner_set) = tokens_for_owner_set {
            tokens_for_owner_set
        } else {
            return vec![];
        };
        let keys = tokens.as_vector();

        let start = u128::from(from_index.unwrap_or(U128(0)));

        keys.iter()
            .skip(start as usize) 
            .take(limit.unwrap_or(0) as usize) 
            .map(|token_id| self.nft_token(token_id.clone()).unwrap())
            .collect()
    }

    /// Get the next NFT that can be bought from a given root
    pub fn get_next_buyable(&self, root_id: TokenId) -> TokenId {
        log!("root_id: {}", &root_id);
        // **WARNING** most likely this is much simplier then this. Possible we will need to create a `last_bought` variable next to instance_nonce
        let root_meta = self.token_metadata_by_id.get(&root_id.clone());
        let root_extra: Extra = serde_json::from_str(&root_meta.unwrap().extra.unwrap()).unwrap();
        //let root_extra: Extra = Some(root_meta.unwrap().extra);
        
        format!("{}-{}", root_id, root_extra.next_buyable.unwrap())
    }

    /// Get the RootNFT from given token ID.
    pub fn get_root(&self, start_id: TokenId) -> TokenId {
        // **WARNING** Do not do loop! Do RegEx instead, or some other, simple, one-line method that solves this problem.

        let mut searched_token_id = start_id;
        loop {
            let current_metadata = self.token_metadata_by_id.get(&searched_token_id.to_owned()).unwrap();
            let current_extra_obj: Extra = serde_json::from_str(&current_metadata.extra.unwrap()).unwrap();
            match current_extra_obj.parent {
                Some(current_parent) => searched_token_id = current_parent,
                None => break,
            }
            env::log_str(&format!("Loop").to_string());
        }

        searched_token_id
    }
}