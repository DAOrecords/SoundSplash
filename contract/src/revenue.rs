use crate::*;

// **WARNING** Most likely this should be removed, or MOVED to the MotherContract. It is already removed from lib.rs

#[near_bindgen]
impl Contract {
    // Calculates the revenue payout
    pub fn revenue_payout(&self, token_id: String, price: U128, max_len_payout: u32) -> Payout {
        let token = self.tokens_by_id.get(&token_id).expect("No token");

        let mut total = 0;
        let price_u128 = u128::from(price);
        let mut payout_object = Payout {
            payout: HashMap::new()
        };
        let revenue = token.revenue;

        assert!(revenue.len() as u32 <= max_len_payout, "Market cannot payout to that many receivers");

        for (key, percent) in revenue.iter() {
            let beneficiary = key.clone();
            payout_object.payout.insert(beneficiary, royalty_to_payout(*percent, price_u128));
            total += *percent;
        }

        assert_eq!(total, 10000, "Total should be 100%!");

        payout_object
    }
}