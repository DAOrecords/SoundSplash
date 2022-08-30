const express = require('express');
const path = require("path");
const { exec } = require('child_process');
const router = express.Router();
const { providers } = require("near-api-js");const fs = require("fs");

const provider = new providers.JsonRpcProvider(
  "https://rpc.mainnet.near.org"
);

router.get('/nfts_by_owner', async function(req, res) {
  const viewMethods = ['nft_metadata', 'nft_token', 'nft_tokens_for_owner', 'nft_tokens', 'get_crust_key', 'get_next_buyable', 'view_guestbook_entries'];

  const rawResult = await provider.query({
    request_type: "call_function",
    account_id: "nft.soundsplash.near",
    method_name: "nft_metadata",
    args_base64: "",
    finality: "optimistic",
  });

  const response = JSON.parse(Buffer.from(rawResult.result).toString());
  console.log(response);

})



module.exports = router;