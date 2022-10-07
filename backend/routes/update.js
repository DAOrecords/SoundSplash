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
router.get('/nfts_for_owner', async function (req, res) {
  try {
    const contractParams = {
      account_id: req.query.owner,
      from_index: "0",
      limit: 10000000
    }

    const contractParamsStringified = JSON.stringify(contractParams);
    const readyBase64 = Buffer.from(contractParamsStringified).toString('base64');

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

    response.map(async (nft) => {
      const uniqID = req.query.contract + nft.token_id;

      const queryString = `INSERT INTO nfts_by_owner (uniq_id, owner_account, contract, nft_id) \
          VALUES ('${uniqID}', '${req.query.owner}', '${req.query.contract}', '${nft.token_id}') \
          ON CONFLICT (uniq_id) DO UPDATE \
            SET owner_account = '${req.query.owner}'`;
      
      await pool.query(queryString)
        .then(() => console.log(`Inserted or updated ${nft.token_id} on contract ${req.query.contract}`))
        .catch((err) => setImmediate(() => {
          console.error("Insert error: ", err);
        }));
    });
  } catch (error) {
    console.error("There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
    res.send("There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
  }
});



module.exports = router;