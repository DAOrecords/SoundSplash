use crate::*;

// **WARNING** Most of this should be moved to the DAO contract, meaning, first modification that happens, is that buying is not possible from this contract
// Then, we will create a certain logic that will make it possible to buy an NFT, initiated from the DAO, inside this contract, it will be a move event.

#[near_bindgen]
impl Contract {
    /// Buy an NFT from the Vault (the contract). Only the next highest level NFT can be purchased (e.g. gen-2, not gen-5)
    #[payable]
    pub fn buy_nft_from_vault(&mut self, token_id: TokenId) {
        env::log_str(&"Start of buy_nft_from_vault".to_string());

        let initial_storage_usage = env::storage_usage();         // Take note of initial storage usage for refund

        let the_token = self.tokens_by_id.get(&token_id.to_string()).unwrap();
        let the_meta = self.token_metadata_by_id.get(&token_id.to_string()).unwrap();
        let the_extra: Extra = serde_json::from_str(&the_meta.extra.unwrap()).unwrap();
        
        assert_eq!(                                               // Assert if the NFT is in the Vault. **WARNING** We wouldn't need all these if we wouldn't let them decide which one they want to buy next (they can't decide. There is only 1 option.)
            the_token.owner_id, 
            self.owner_id,                                        // Vault
            "Token must be owned by Vault"
        );

        // CALLER MUST BE OWNER!!

/* MOVE THIS TO DAO CONTRACT
        assert_eq!(                                               // This big number is 0.1 NEAR. Most of the time 0.075 NEAR will be refunded
	        u128::from(the_extra.original_price) + 100000000000000000000000,    // **WARNING**  We wouldn't need the 0.1 NEAR, if we could be sure that the contract will always have enough money. This is something that we haven't ensured.
	        u128::from(env::attached_deposit()), 
	        "Must send the exact amount"
        );
*/        
        let root_id = self.get_root(token_id.clone());            // root could be calculated with string manipulation as well.
        log!("Root ID: {:?}", root_id);
        log!("Next buyable: {:?}", self.get_next_buyable(root_id.clone()));
        assert_eq!(                                               // Assert that this is the next one in line
            &self.get_next_buyable(root_id.clone()), 
            &token_id, 
            "This is not the token that should be bought next."
        );

        self.internal_transfer(                                   // Transfer the NFT from Vault to the new owner
            &env::current_account_id(),                           // not good.
            &env::signer_account_id(), 
            &token_id, 
            None,                                                 // No approval ID
            None                                                  // No memo
        );

        // If this is the first buy, revenue table should be applied. 
        // Both the revenue payout and the create_children should only happen, if this is the first buy. When marketplace is activated, this might not be the case anymore.
        // Otherwise, the royalty table should be applied, but ideally, that would be initiated from another contract with a cross-contract-call
        // The problem is, we want to have a marketplace as well. So there we should have the contract, that way we will have 2 contracts
        // We can create a testing-app, which would be just a very simple marketplace
        // **WARNING** This is mostly not true, the revenue table / royalty table does not work that way.
// **WARNING this should be removed, Mother Contract should do this ->
        /*let payout_table = self.revenue_payout(                   // Will contain amounts in yoctoNEAR
            token_id.clone(),
            price,
            6
        );
        
        for (key, amount) in payout_table.payout.iter() {         // Send the money to each account on the list
            let beneficiary = key.clone();
            Promise::new(beneficiary).transfer(u128::from(amount.clone()));
        }*/
        // **WARNING** It is possible that this is going to change, because the DAO will handle that part.
// **WARNING <- this should be deleted, Mother Contract should do this
        self.create_children(
            root_id, 
            token_id
        );
        // **WARNING** We thought about changing this part, we wouldn't create the children in this run, only when we need it. I think if it's not too expensive, it makes sense to leave it as it is.


        let required_storage_in_bytes = env::storage_usage() - initial_storage_usage;
        refund_deposit(required_storage_in_bytes);                // Refund extra amount payed (NFT price + storage cost is the amount needed)

        env::log_str(&"End of buy_nft_from_vault".to_string());
    }
}