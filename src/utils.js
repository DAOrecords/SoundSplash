import { connect, Contract, keyStores, WalletConnection, utils, KeyPair, providers } from 'near-api-js';
import * as nearAPI from "near-api-js";
const CryptoJS = require('crypto-js');

const mode = 'development';       // 'mainnet' || 'development'

const provider = new providers.JsonRpcProvider(
  "https://rpc.mainnet.near.org"
);

/** Real config. It's async. It was important when we tried to clone the site, so the config is not burnt in */
async function getRealConfig(env) {
  let contractName;
  try {
    contractName = await getContractName();
  } catch (error) {
    console.error(error) 
  }
  const { keyStores } = nearAPI;
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();

  switch (env) {
    case 'development':
      return {
        networkId: 'testnet',
        nodeUrl: 'https://rpc.testnet.near.org',
        keyStore,
        contractName: contractName,
        walletUrl: 'https://wallet.testnet.near.org',
        helperUrl: 'https://helper.testnet.near.org',
        explorerUrl: 'https://explorer.testnet.near.org',
      }
    case 'mainnet':
      return {
        networkId: 'mainnet',
        nodeUrl: 'https://rpc.mainnet.near.org',
        contractName: contractName,
        walletUrl: 'https://wallet.near.org',
        helperUrl: 'https://helper.mainnet.near.org',
        explorerUrl: 'https://explorer.mainnet.near.org',
      }
    default:
      throw Error(`env is needed`);
  }
}

export async function getContractName() {
  return window.contractName;
}

export async function mintRootNFT(title, desc, imageCID, imageHash, musicCID, musicHash, price, revenue, foreverRoyalty) {
  let success = false;
  
  const root_args = {
    receiver_id: window.accountId,
    metadata: {
      title: title,                                          
      description: desc,
      media: imageCID,                                             // This is the CID of the NFT image
      media_hash: btoa(imageHash),                                 // This is the SHA256 hash of the NFT image, converted to Base64
      copies: null,                                                // number of copies of this set of metadata in existence when token was minted.
      issued_at: Date.now(),                                       // When token was issued or minted, Unix epoch in milliseconds
      expires_at: null,                                            // When token expires, Unix epoch in milliseconds
      starts_at: null,                                             // When token starts being valid, Unix epoch in milliseconds
      updated_at: null,                                            // When token was last updated, Unix epoch in milliseconds
      extra: JSON.stringify({
        music_cid: musicCID,                                       // This is the CID of the music
        music_hash: btoa(musicHash),                               // This is the SHA256 hash of the music, converted to Base64 
        original_price: "0",                                       // The RootNFT will be transfered to Owner (for free)
        instance_nounce: 0,                                        // Mandatory
        generation: 1,                                             // RootNFT is the first generation
      }),
      reference: null,                                             // URL to an off-chain JSON file with more info.
      reference_hash: null                                         // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
    },
    children_price: utils.format.parseNearAmount(price),           // Price for the next 2 NFTs (children). This will be their original_price
    perpetual_royalties: foreverRoyalty,
    revenue_table: revenue
  }

  const gas = 100000000000000;
  const amount = utils.format.parseNearAmount("0.1");

  var contract = window.contractName;
  await window.wallet.callMethod({ method: 'mint_root', args: root_args, gas, contractId: contract, deposit: amount })
    .then((msg) => { 
      console.log("Success! (mint root)", msg); 
      success = true; 
    })
    .catch((err) => console.log("Error while minting root: ", err));

  return success;
}

export async function setSeed(seed) {
  const accountId = window.accountId;                              // We encrypt the Crust key using the NEAR priv key (has to be owner)
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const keyPair = await keyStore.getKey("testnet", accountId);

  const encryptedKey = CryptoJS.AES.encrypt(seed, keyPair.secretKey).toString();

  var contract = window.contractName;
  await window.wallet.callMethod({ method: 'set_crust_key', args: { encrypted_key: encryptedKey }, contractId: contract })
    .then((msg) => console.log("The Contract says ", msg))
    .catch((err) => console.error("Error occured while uploading encrypted key:", err));
}


export async function getSeed() {
  const accountId = window.accountId;                              // We decrypt the Crust key using the NEAR priv key (has to be owner)
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  const keyPair = await keyStore.getKey("testnet", accountId);
  let encryptedKey = null;

  var contract = window.contractName;
  await window.wallet.viewMethod({ method: 'get_crust_key', contractId: contract })
    .then((result) => encryptedKey = result)
    .catch((err) => {console.log("Error occured while fetching encrypted key: ", err); console.log(err)})
  if (encryptedKey) {
    return CryptoJS.AES.decrypt(encryptedKey, keyPair.secretKey).toString(CryptoJS.enc.Utf8);
  } else {
    return null;                                                   // Error occured while fetching key
  }
}

export async function buyNFTfromVault(contract, tokenId, price) {
  // window.contract.contractId = contract;
  const args = {
    token_id: tokenId,
  };
  const gas = 200000000000000;
  const formattedPrice = utils.format.formatNearAmount(price);    // Human readable
  console.log("price: ", price)
  console.log("formattedPrice: ", formattedPrice)
  const nearAmount = (parseFloat(formattedPrice) + 0.1).toFixed(5);
  const amount = utils.format.parseNearAmount(nearAmount.toString());
  console.log("nearAmount: ", nearAmount)
  console.log("amount: ", amount)
  
  await window.wallet.callMethod({ method: 'buy_nft_from_vault', args, contractId: contract, deposit: amount, gas: gas })
    .then((result) => console.log("Buy-result: ", result))
    .catch((err) => console.error("Error during buy-from-Vault: ", err));
}

export async function getBuyableTokens() {
  let rootIDs = null;
  let inVault = null;

  console.log(window.accountId)
  console.log(contractAccount)
  const options = {
    limit: 999999,
  }

  var contract = window.contractName;
  await window.wallet.viewMethod({ method: 'nft_tokens', contractId: contract, args: options })
    .then((response) => {    
      console.log("RESPONSE: ", response)                                      
      inVault = response.filter((nft) => nft.owner_id === contractAccount);
      rootIDs = inVault.map((nft) => {                             // First we make a list of the NFTs that are in the Vault
        const pos = nft.token_id.lastIndexOf("-");
        return nft.token_id.substr(0, pos);
      });
      rootIDs = [...new Set(rootIDs)];                             // IDs of the RootNFTs which has children in the Vault
    })
    .catch((err) => console.error(err))
    
    const nextNFTs = await Promise.all(rootIDs.map(async (id) => { // We get the next buyable NFT for each root (lowest generation)
      const result = await getNextBuyableInstance(contractAccount, id);
      return result;
    }))
    const finalRes = nextNFTs.map((id) => inVault.find((nft) => {
      return nft.token_id === id;
    }))
    console.log(finalRes)
    return finalRes;                                               // Results will be array of NFT objects
}

export async function getNextBuyableInstance(contract, rootId) {
  const args = {
    root_id: rootId
  }

  try {
    const nextId = await window.wallet.viewMethod({ method: 'get_next_buyable', args, contractId: contract });

    return nextId;
  } catch (error) {
    console.error("There was an error while trying to get the id of the next buyable NFT: ", error);
  }
}

export async function getListForAccount() {
  let result = null;
  
  const options = {
    account_id: window.accountId,
    limit: 10000,
  }

  var url = "https://daorecords.io:8443/get/nft_list_for_owner?user=";
  if(window.accountId.includes(".testnet")){
    url = "https://daorecords.io:8443/get/nft_list_for_owner?testnet=1&user=";
  }

  await fetch(url + window.accountId)
    .then((res) => res.json())
    .then((response) => {
      console.log("Response: ", response);
      result = response.nft_list;
    })
    .catch((err) => console.error("Error while fetching list of NFTs for connected user! ", err));

  return result;
}

export async function getNftListWithThumbnails(start, pageSize) {
  // We don't use start and pageSize yet

  let result = [];
  var url = "https://daorecords.io:8443/get/nft_list";
  if(window.accountId.includes(".testnet")){
    url = "https://daorecords.io:8443/get/nft_list?testnet=1";
  }
  
  await fetch(url)
    .then((res) => res.json())
    .then((response) => {
      result = response.list;
    })
    .catch((err) => console.error("Error while fetching nft list from server! ", err));

    return result;
}

export async function getNumberOfNfts() {
  let result = null;
  var url = "https://daorecords.io:8443/get/nft_list_length";
  if(window.accountId.includes(".testnet")){
    url = "https://daorecords.io:8443/get/nft_list_length?testnet=1";
  }

  await fetch(url)
    .then((res) => res.json())
    .then((response) => {
      result = response.nft_count;
    })
    .catch((err) => console.error("There was an error while trying to get the total number of root nfts: ", err));

  return result;
}

export async function transferNft(tokenId, receiverId) {
  let success = false;
  const args = {
    token_id: tokenId,
    receiver_id: receiverId
  }
  const gas = 100000000000000;
  const amount = utils.format.parseNearAmount("0.1");

  var contract = window.contractName;
  await window.wallet.callMethod({ method: 'transfer_nft', args, gas, contractId: contract, deposit: amount  })
    .then((msg) => { 
      console.log("Success! (mint root)", msg); 
      success = true; 
    })
    .catch((err) => console.error("There was an error while transfering the token: ", err));
  
  return success;
}

export async function sendGuestBookEntry(text) {
  const newEntry = {
    sender: "me",
    message: text,
    date: new Date().toUTCString(),
  }

  const gas = 100000000000000;
  const amount = utils.format.parseNearAmount("0.1");  

  var contract = window.contractName;
  await window.wallet.callMethod({ method: 'create_guestbook_entry', args: { new_entry: newEntry }, gas, contractId: contract, deposit: amount  })
    .then((resp) => console.log("Response from create_guestbook_entry: ", resp))
    .catch((err) => console.error("Error from create_guestbook_entry: ", err));
}

export async function getGuestBookEntries() {
  let result = null;
  
  const options = {
    from_index: "0",
    limit: 1000000,
  }

  var contract = window.contractName;
  await window.wallet.viewMethod({ method: 'view_guestbook_entries', args: options, contractId: contract })
    .then((response) => {
      console.log("Response: ", response);
      result = response;
    })
    .catch((err) => console.error("Error while fetching guestbook entries: ", err));

  return result;
}

// Get details for a provided NFT list 
export async function getNftDetailsForList(contract, list) {
  const args = {
    token_list: list
  }

  const result = await window.wallet.viewMethod({ method: 'nft_token_details_for_list', args, contractId: contract });
  return result;
}

// does not work
export async function checkIfAccountExists() {
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, await getRealConfig(mode)));
  const account = await near.account("account-ain9ahzair.testnet");
  const result = await account.getAccountDetails();
  return result;
}

// Will give back all children and the root from a given root. (All NFTs with same media, we could call this a collection)
export async function getAllFromRoot(rootId) {
  const options = {
    limit: 999999,
  }
  let nftTree = [];                                                                        // NFTs that belong to the given root

  var contract = window.contractName;
  await window.wallet.viewMethod({ method: 'nft_tokens', args: options, contractId: contract })
    .then((totalList) => {                                          
      nftTree = totalList.filter((item) => item.token_id.includes(rootId));
    })
    .catch((err) => console.error(err));

    return nftTree;
}

export async function totalMinted() {
  // This could be more effective if we rewrote the contract
  let result = -1;
  const options = {
    limit: 999999999999,
  }

  var contract = window.contractName;
  await window.wallet.viewMethod({ method: 'nft_tokens', args: options, contractId: contract })
    .then((response) => {                                          
      result = response.length;
    })
    .catch((err) => console.error(err));

    return result;
}

export async function withdrawFunds(amount) {
  let result = -1;
  const formattedAmount = utils.format.parseNearAmount(amount);
  const options = {
    amount: formattedAmount
  }

  var contract = window.contractName;
  await window.wallet.callMethod({ method: 'withdraw', args: options, contractId: contract  })
    .then((response) => {                                          
      console.log("Success! (withdraw)");
      result = response;
    })
    .catch((err) => console.error(err));

    return result;
}

export async function getBalance() {
  if(window.accountId){
    const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, await getRealConfig(mode)));
    const account = await near.account(window.accountId);
    const yocto =  await account.getAccountBalance();
    return utils.format.formatNearAmount(yocto.available);
  }
}

export async function verify_sha256(blob, hash) {
  const fileArrayBuffer = await new Response(blob).arrayBuffer();
  let wordArray = CryptoJS.lib.WordArray.create(fileArrayBuffer);
  const dataHash = CryptoJS.SHA256(wordArray).toString();

  return btoa(dataHash) === hash;
}

export function logout() {
  window.wallet.signOut();
  //window.location.replace(window.location.origin + window.location.pathname)               // reload page
}

export async function login() {
  window.wallet.signIn();
}