const express = require('express');
const path = require("path");
const { exec } = require('child_process');
const router = express.Router();
const { providers } = require("near-api-js");const fs = require("fs");
const pg = require('pg');
const Pool = require('pg').Pool;
const dotenv = require('dotenv');
const { async } = require('regenerator-runtime');
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
  let contracts = [];

  await pool.query('SELECT * FROM contracts')
    .then((res) => contracts = res.rows)
    .catch((err) => setImmediate(() => {
      throw err;
    })
  );

  // We go through all the contracts
  contracts.map(async (contract) => {
    try {
      const rawResult = await provider.query({
        request_type: "call_function",
        account_id: contract.contract_name,
        method_name: "nft_tokens",
        args_base64: "eyJmcm9tX2luZGV4IjoiMCIsImxpbWl0IjoxMDAwMDAwMH0=",
        finality: "optimistic",
      });
    
      const response = JSON.parse(Buffer.from(rawResult.result).toString());
    
      if (response.length >= 9999999) console.error("                               \
        We are reaching the limit that we set for nft_tokens, which is 10 million!  \
        At this point, we should probably request the list of NFTs with pagination. \
      ");
    
      // We insert every NFT that is not already inserted. We overwrite the owner, if it has changed.
      response.map(async (nft) => {
        
        const uniqID = contract.contract_name + nft.token_id;

        const queryString = `INSERT INTO nfts_by_owner (uniq_id, owner_account, contract, nft_id) \
          VALUES ('${uniqID}', '${nft.owner_id}', '${contract.contract_name}', '${nft.token_id}') \
          ON CONFLICT (uniq_id) DO UPDATE \
            SET owner_account = '${nft.owner_id}'`;

        await pool.query(queryString)
          .then(() => console.log(`Inserted or updated ${nft.token_id} on contract ${contract.contract_name}`))
          .catch((err) => setImmediate(() => {
            console.error("Insert error: ", err);
          }))
      });
      
    } catch (error) {
      console.error("There was an error while trying to fetch the nft_tokens to fill the 'nfts_by_owner' table: '", error);
      res.send("There was an error while trying to fill the nfts_by_owner table.", error);
    }
  });
  res.send("Filling up the nfts_by_owner table was successfull.");
})



module.exports = router;