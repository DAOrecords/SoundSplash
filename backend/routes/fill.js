const express = require('express');
const path = require("path");
const { exec } = require('child_process');
const router = express.Router();
const { providers } = require("near-api-js");const fs = require("fs");
const pg = require('pg');
const Pool = require('pg').Pool;
const dotenv = require('dotenv');
//const { base64 } = require('near-sdk-as');
dotenv.config();


const provider = new providers.JsonRpcProvider(
  "https://rpc.mainnet.near.org"
);

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: 'localhost',
  database: 'daorecords',
  password: process.env.DB_PASSWORD,
  port: 5432,
});
pool.connect();


router.get('/nfts_by_owner', async function(req, res) {
  const viewMethods = ['nft_metadata', 'nft_token', 'nft_tokens_for_owner', 'nft_tokens', 'get_crust_key', 'get_next_buyable', 'view_guestbook_entries'];

  let contractName = null;
  let args = {
    limit: 4294967296
  }

  await pool.query('SELECT * FROM contracts')
    .then((res) => contractName = res.rows[0].contract_name)
    .catch((err) => setImmediate(() => {
      throw err;
    })
  );

  console.log("contractName: ", contractName);

  const rawResult = await provider.query({
    request_type: "call_function",
    account_id: contractName,
    method_name: "nft_tokens",
    args_base64: "eyJmcm9tX2luZGV4IjoiMCIsImxpbWl0Ijo0Mjk0OTY3Mjk2fQ==",
    finality: "optimistic",
  });

  const response = JSON.parse(Buffer.from(rawResult.result).toString());
  console.log(response);

})



module.exports = router;