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
          VALUES ('${uniqID}', '${nft.owner_id}', '${req.query.contract}', '${nft.token_id}') \
          ON CONFLICT (uniq_id) DO UPDATE \
            SET owner_account = '${nft.owner_id}'`;
      
      await pool.query(queryString)
        .then(() => console.log(`Inserted or updated ${nft.token_id} on contract ${req.query.contract}`))
        .catch((err) => setImmediate(() => {
          console.error("Insert error: ", err);
        }));
    });

    res.send({success: true, message: "Done."});
  } catch (error) {
    console.error("There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
    res.send("There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
  }
});


// This route will update the entries for a given user, on all contracts
router.get('/all_nfts_for_owner', async function (req, res) {
  try {
    let contracts = [];

    await pool.query('SELECT * FROM contracts')
      .then((res) => contracts = res.rows)
      .catch((err) => setImmediate(() => {
        throw err;
      })
    );

    contracts.map(async (contract) => {
      const contractParams = {
        account_id: req.query.owner,
        from_index: "0",
        limit: 10000000
      }

      const contractParamsStringified = JSON.stringify(contractParams);
      const readyBase64 = Buffer.from(contractParamsStringified).toString('base64');

      const rawResult = await provider.query({
        request_type: "call_function",
        account_id: contract.contract_name,
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
        const uniqID = contract.contract_name + nft.token_id;
  
        const queryString = `INSERT INTO nfts_by_owner (uniq_id, owner_account, contract, nft_id) \
            VALUES ('${uniqID}', '${nft.owner_id}', '${contract.contract_name}', '${nft.token_id}') \
            ON CONFLICT (uniq_id) DO UPDATE \
              SET owner_account = '${nft.owner_id}'`;
        
        await pool.query(queryString)
          .then(() => console.log(`Inserted or updated ${nft.token_id} on contract ${contract.contract_name}`))
          .catch((err) => setImmediate(() => {
            console.error("Insert error: ", err);
          }));
      });
    });

    res.send({success: true, message: "Done."});
  } catch (error) {
    console.error("(/all_nfts_for_owner) There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
    res.send("(/all_nfts_for_owner) There was an error while trying to fetch the nft tokens to update the 'nfts_by_owner' table: ", error);
  }
});


// This route will update a single NFT, input parameters are `contract` and `nft_id`
router.get('/single_nft', async function (req, res) {
  try {
    const contractParams = {
      token_list: [ req.query.nft_id ],
    }

    const contractParamsStringified = JSON.stringify(contractParams);
    const readyBase64 = Buffer.from(contractParamsStringified).toString('base64');

    const rawResult = await provider.query({
      request_type: "call_function",
      account_id: req.query.contract,
      method_name: "nft_token_details_for_list",
      args_base64: readyBase64,
      finality: "optimistic",
    });
  
    const response = JSON.parse(Buffer.from(rawResult.result).toString());
    const nft = response[0];
    const uniqID = req.query.contract + nft.token_id;

    const queryString = `INSERT INTO nfts_by_owner (uniq_id, owner_account, contract, nft_id) \
          VALUES ('${uniqID}', '${nft.owner_id}', '${req.query.contract}', '${nft.token_id}') \
          ON CONFLICT (uniq_id) DO UPDATE \
            SET owner_account = '${nft.owner_id}'`;
      
    await pool.query(queryString)
      .then(() => console.log(`Inserted or updated ${nft.token_id} on contract ${req.query.contract}`))
      .catch((err) => setImmediate(() => {
        console.error("Insert error: ", err);
      }));

      res.send({success: true, message: "Done."});
  } catch (error) {
    console.error(`There was an error while trying to update entry for a single NFT for ${req.query.nft_id}, in the 'nfts_by_owner' table. Error message: `, error);
    res.send(`There was an error while trying to update entry for a single NFT for ${req.query.nft_id}, in the 'nfts_by_owner' table. Error message: `, error);
  }
});

module.exports = router;