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


router.get('/nft_list_for_owner', function (req, res) {

});

router.get('/thumbnail', async function (req, res) {
  try {
    const rootID = req.query.root_id;
    const contract = req.query.contract;
    const uniqID = contract + rootID;
    console.log("uniq_id: ", uniqID);
    await pool.query('SELECT thumbnail FROM nft_thumbnails WHERE uniq_id = $1', [uniqID])
      .then((response) => {
        console.log("res: ", response)
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