const express = require('express');
const path = require("path");
const fs = require('fs');
const { exec } = require('child_process');
const router = express.Router();


router.get('/', function(req, res) {
  let result = null;
  const options = {
    root: path.join('/root/cache/')
  };

  exec(`ipfs get ${req.query.cid} --output ${options.root}`, function (error, stdout, stderr) {
    if (error) {                                                                      // ipfs command gave an error
      console.log(`error: ${error.message}`);
      result = -1;
    }
    if (result !== -1) {
      const path = req.query.cid;                                                     // CID of the file
      res.sendFile(path, options, function (err) {                                    // Send the file to the front-end
        if (err) {
          console.error("There was an error while trying to send the file: ", err);
        } else {
          console.log('Sent file: ', path);
          //fs.unlinkSync(path);                                                        // Clean up (delete the file from /backend folder)
        }
      });
    }
  });
})

module.exports = router;