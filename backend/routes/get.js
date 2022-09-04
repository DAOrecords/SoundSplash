const express = require('express');
const router = express.Router();
const Pool = require('pg').Pool;
const dotenv = require('dotenv');
dotenv.config();

// PostgreSQL connection details
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: 'localhost',
  database: 'daorecords',
  password: process.env.DB_PASSWORD,
  port: 5432,
});
pool.connect();


router.get('/nft_list_for_owner', async function (req, res) {
  try {
    const user = req.query.user;

    await pool.query('SELECT (contract, nft_id) FROM nfts_by_owner WHERE owner_account = $1', [user])
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

router.get('/thumbnail', async function (req, res) {
  try {
    const rootID = req.query.root_id;
    const contract = req.query.contract;
    const uniqID = contract + rootID;
    
    await pool.query('SELECT thumbnail FROM nft_thumbnails WHERE uniq_id = $1', [uniqID])
      .then((response) => {
        res.send({
          thumbnail: response.rows[0].thumbnail
        })
      })
      .catch((error) => console.error("Error while querying thumbnail: ", error));
  } catch (error) {
    console.error("There was an error while trying to fetch the thumbnail: ", error);
    res.send({message: "There was an error while trying to fetch the thumbnail", error: error});
  }
});


module.exports = router;