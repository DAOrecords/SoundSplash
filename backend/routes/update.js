const express = require('express');
const { exec } = require('child_process');
const router = express.Router();
const { providers } = require("near-api-js");const fs = require("fs");
const Pool = require('pg').Pool;
const dotenv = require('dotenv');
const sharp = require('sharp');
dotenv.config();

// NEAR RPC
const provider = new providers.JsonRpcProvider(
  "https://rpc.mainnet.near.org"
);

// PostgreSQL connection details
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: 'localhost',
  database: 'daorecords',
  password: process.env.DB_PASSWORD,
  port: 5432,
});
pool.connect();


// This route will update the entries for a given user (will delete ownership, or add ownership of NFTs, based on response from contract)
router.get('nfts_for_owner', async function (req, res) {

  console.log("Before try...catch...");

  try {
    console.log("Before obj creation");
    const contractParams = {
      account_id: req.query.owner,
      from_index: "0",
      limit: 10000000
    }

    const contractParamsStringified = JSON.stringify(contractParams);
    const readyBase64 = Buffer.from(contractParamsStringified).toString('base64');
    console.log("Base 64 is ready: ", readyBase64);

    const rawResult = await provider.query({
      request_type: "call_function",
      account_id: req.query.contract,
      method_name: "nft_tokens_for_owner",
      args_base64: readyBase64,
      finality: "optimistic",
    });
  
    const response = JSON.parse(Buffer.from(rawResult.result).toString());

    if (response.length >= 9999999) console.error("                               \
      We are reaching the limit that we set for nft_tokens, which is 10 million!  \
      At this point, we should probably request the list of NFTs with pagination. \
    ");

    console.log("Response from NEAR: ", response);

  } catch (error) {
    console.error("There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
    res.send("There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
  }
});



module.exports = router;