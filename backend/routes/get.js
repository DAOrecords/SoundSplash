const express = require('express');
const router = express.Router();
const Pool = require('pg').Pool;
const dotenv = require('dotenv');
dotenv.config();

// PostgreSQL connection details
const productionPool = new Pool({
  user: process.env.DB_USERNAME,
  host: 'localhost',
  database: 'daorecords',
  password: process.env.DB_PASSWORD,
  port: 5432,
});
productionPool.connect();

// PostgreSQL testnet connection details
const testnetPool = new Pool({
  user: process.env.DB_USERNAME,
  host: 'localhost',
  database: 'testnet',
  password: process.env.DB_PASSWORD,
  port: 5432,
});
testnetPool.connect();


// Get list of NFTs for user, accross all contracts that our database knows
router.get('/nft_list_for_owner', async function (req, res) {
  try {
    const user = req.query.user;
    const testnet = req.query.testnet;
    const pool = (testnet ? testnetPool : productionPool);

    await pool.query('SELECT * FROM nfts_by_owner WHERE owner_account = $1', [user])
      .then((response) => {
        let nftList = [];
        
        response.rows.map((row) => nftList.push({
          contract: row.contract,
          nft_id: row.nft_id
        }));

        res.send({
          user: user,
          nft_list: nftList
        });
      })
      .catch((error) => console.error("There was an error while querying the database for NFTs for a given user: ", error));
  } catch (error) {
    console.error("There was an error while trying to fetch the list of NFTs for a given user: ", error);
    res.send({message: "There was an error while trying to fetch the list of NFTs for a given user", error: error})
  }
});


// Get the thumbnail for an NFT
// The database can't store bigger images then 32 KB (because we set VARCHAR(32768)) and average images should be 6 KB
// Example thumbnail?root_id=fono-root-1&contract=nft.soundsplash.near
router.get('/thumbnail', async function (req, res) {
  try {
    const rootID = req.query.root_id;
    const contract = req.query.contract;
    const uniqID = contract + rootID;
    const testnet = req.query.testnet;
    const pool = (testnet ? testnetPool : productionPool);
    
    await pool.query('SELECT thumbnail FROM nft_thumbnails WHERE uniq_id = $1', [uniqID])
      .then((response) => {
        res.send({
          thumbnail: response.rows[0].thumbnail
        });
      })
      .catch((error) => console.error("Error while querying thumbnail: ", error));

  } catch (error) {
    console.error("There was an error while trying to fetch the thumbnail: ", error);
    res.send({message: "There was an error while trying to fetch the thumbnail", error: error});
  }
});

// Get list of artists (collaborators) for a given contract and root_id
// The response will be stringified JSON
router.get('/collaborators', async function (req, res) {
  try {
    const rootID = req.query.root_id;
    const contract = req.query.contract;
    const uniqID = contract + rootID;
    const testnet = req.query.testnet;
    const pool = (testnet ? testnetPool : productionPool);

    await pool.query('SELECT collab_list FROM collaborators WHERE uniq_id = $1', [uniqID])
      .then((response) => {
        res.send({
          collab_list: response.rows[0].collab_list
        });
      })
      .catch((error) => console.error("Error while querying collab_list: ", error));

  } catch (error) {
    console.error("There was an error while trying to get the list of collaborators: ", error);
    res.send({
      message: "There was an error while trying to get the list of collaborators", 
      error: error, 
      contract: req.query.contract, 
      root_id: req.query.root_id
    });
  }
});


// Get list of NFT thumbnails, with all fields and with pagination
router.get('/nft_list', async function (req, res) {
  try {
    const start = req.query.start || 0;
    const pageSize = req.query.page_size || 10000000;
    const testnet = req.query.testnet;
    const pool = (testnet ? testnetPool : productionPool);

    await pool.query(`SELECT * FROM nft_thumbnails LIMIT ${pageSize} OFFSET ${start}`)
      .then((response) => {
        res.send({
          list: response.rows
        })
      })
      .catch((err) => console.error("Error while querying list (in route nft_list): ", err));
    
  } catch (error) {
    console.error("There was an error while trying to get paginated NFT list from the 'nft_thumbnails' table: ", error);
    res.send({
      message: "There was an error while trying to get paginated NFT list from the 'nft_thumbnails' table",
      error: error,
      start: start,
      pageSize: pageSize
    });
  }
});


// Get number of entries in thumbnails table (returns a number)
router.get('/nft_list_length', async function (req, res) {
  const testnet = req.query.testnet;
  const pool = (testnet ? testnetPool : productionPool);

  try {
    await pool.query("SELECT null FROM nft_thumbnails")
      .then((response) => {
        res.send({
          nft_count: response.rowCount
        });
      })
      .catch((err) => console.error("There was an error while querying thumbnails (nft_list_length): ", err));
  } catch (error) {
    console.error("There was an error while trying to get the table length from 'nft_thumbnails: ", error);
    res.send({
      message: "There was an error while trying to get the table length from 'nft_thumbnails",
      error: error
    })
  }
});

module.exports = router;