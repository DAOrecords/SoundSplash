const express = require('express');
const path = require("path");
const { exec } = require('child_process');
const router = express.Router();
const nearAPI = require("near-api-js");
const { providers } = require("near-api-js");const fs = require("fs");
const homedir = require("os").homedir();

const provider = new providers.JsonRpcProvider(
  "https://rpc.mainnet.near.org"
);

router.get('/nfts_by_owner', async function(req, res) {
  const rawResult = await provider.query({
    request_type: "call_function",
    account_id: "nft.soundsplash.near",
    method_name: "nft_metadata",
    args_base64: "",
    finality: "optimistic",
  });

  // format result
  const response = JSON.parse(Buffer.from(rawResult.result).toString());
  console.log(response);

/*
  const contract = new Contract(near.account(), "nft.soundsplash.near", {
    viewMethods: ['nft_metadata', 'nft_token', 'nft_tokens_for_owner', 'nft_tokens', 'get_crust_key', 'get_next_buyable', 'view_guestbook_entries'],
    changeMethods: ['new_default_meta', 'new', 'mint_root', 'set_crust_key', 'buy_nft_from_vault', 'transfer_nft', 'create_guestbook_entry', 'withdraw', 'copy'],
  });

  await contract.nft_metadata()
    .then((msg) => console.log("Success! The message: ", msg))
    .catch((err) => console.error("There was an error: ", err));
*/
})



module.exports = router;