const express = require('express');
const path = require("path");
const { exec } = require('child_process');
const router = express.Router();
const nearAPI = require("near-api-js");
const { KeyPair, keyStores, connect, WalletConnection } = require("near-api-js");
const fs = require("fs");
const homedir = require("os").homedir();

const ACCOUNT_ID = "unsafe_server_account.optr.near";  // NEAR account tied to the keyPair
const NETWORK_ID = "mainnet";
const KEY_PATH = '../unsafe_server_account.optr.near.json';

const credentials = JSON.parse(fs.readFileSync(KEY_PATH));
const myKeyStore = new keyStores.InMemoryKeyStore();
myKeyStore.setKey(NETWORK_ID, ACCOUNT_ID, KeyPair.fromString(credentials.private_key));

const connectionConfig = {
  networkId: "mainnet",
  keyStore: myKeyStore, // first create a key store
  nodeUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://wallet.mainnet.near.org",
  helperUrl: "https://helper.mainnet.near.org",
  explorerUrl: "https://explorer.mainnet.near.org",
};


router.get('/nfts_by_owner', function(req, res) {
  const nearConnection = await connect(connectionConfig);
  const walletConnection = new WalletConnection(nearConnection);
  const accountId = walletConnection.getAccountId();

  contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
    viewMethods: ['nft_metadata', 'nft_token', 'nft_tokens_for_owner', 'nft_tokens', 'get_crust_key', 'get_next_buyable', 'view_guestbook_entries'],
    changeMethods: ['new_default_meta', 'new', 'mint_root', 'set_crust_key', 'buy_nft_from_vault', 'transfer_nft', 'create_guestbook_entry', 'withdraw', 'copy'],
  });

  await contract.nft_metadata()
    .then((msg) => console.log("Success! The message: ", msg))
    .catch((err) => console.error("There was an error: ", err));

})



module.exports = router;