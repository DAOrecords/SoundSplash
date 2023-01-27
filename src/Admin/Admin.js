import React, { useState, useEffect, useCallback } from 'react';
// import 'regenerator-runtime/runtime';
const axios = require('axios');
const CryptoJS = require('crypto-js'); 
import MediaDropzone from './MediaDropzone';
import { mintRootNFT } from '../utils';
import PreviewBox from './PreviewBox';
import SmallUploader from './SmallUploader';
import infoLogo from '../assets/info.svg';
import ConnectWallet from './ConnectWallet';
import xButton from '../assets/xButton.svg';
import blackXButton from '../assets/blackXButton.svg';
import plusButton from '../assets/plusButton.svg';
import ArtistList from './ArtistList';


export default function Admin({newAction, vault}) {  
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("0");
  
  // For the image
  const [image, setPreview] = useState({name: "", src: null});                   // This will store actual data
  const [imageReady, setImageReady] = useState(false);
  const [imageCID, setImageCID] = useState("");
  const [imageHash, setImageHash] = useState("");
  
  // For the music
  const [music, setMusic] = useState({name: "", src: null});                     // This will store actual data
  const [musicReady, setMusicReady] = useState(false);
  const [musicCID, setMusicCID] = useState("");
  const [musicHash, setMusicHash] = useState("");

  // For the royalties
  const royaltyPercent = 1000;                                                   // Max is 10000, current value would be 10%
  const [revenues, setRevenues] = useState([                                     // Will contain objects of the format { account: "alice.near", percent: 2000 }
    { 
      account: "daorecords.sputnik-dao.near", 
      percent: 1500 
    },
    { 
      account: "recordpooldao.sputnik-dao.near",
      percent: 500
    }
  ]);                                  

  // Artist List
  const [artistList, setArtistList] = useState([]);                              // Array of artist objects
  

  useEffect(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('errorCode')) {
      newAction({
        errorMsg: "There was an error during the transaction!", errorMsgDesc: urlParams.get('errorCode'),
      }); 
    } else if (urlParams.has('transactionHashes')) {
      newAction({
        successMsg: "NFT Minted!", successMsgDesc: "The new RootNFT was successfully minted",
      });
    }
  }, [])

  const onDropMedia = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];                            // We can only accept 1 file
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);                           // Read as array buffer, because we need that for SHA256

    const base64Converter = new FileReader();
    base64Converter.readAsDataURL(file);
    base64Converter.onload = function(e) {
      if (file.type.includes("image")) {
        setPreview({
          name: file.name,
          src: e.target.result,
        });
      }
      if (file.type.includes("audio")) {
        setMusic({
          name: file.name,
          src: e.target.result,
        });
      }
    }

    reader.onload = async function () {                           // onload callback gets called after the reader reads the file data
      let wordArray = CryptoJS.lib.WordArray.create(reader.result);

      // Upload the file to our server using Axios
      if (file.type.includes("audio")) uploadFile(file, wordArray, "music");
      if (file.type.includes("image")) uploadFile(file, wordArray, "image");
    }
  });

  /** Upload file to server. The server will do the IPFS pinning */
  function uploadFile(file, wordArray, fileType) {
    let successBoolean = false;

    const uploadPromise = new Promise(async (resolve, reject) => {
      const formData = new FormData();
      formData.append("myFile", file);
      console.log("file: ", file)
      const headers = {
        'Content-Type': 'multipart/form-data',
      }
      await axios.post(`https://daorecords.io:8443/upload/${fileType}`, formData, { headers })
        .then((response) => {
          console.log("THE RESPONSE: ", response);
          if (fileType === "image") {
            setImageHash(CryptoJS.SHA256(wordArray).toString());
            setImageCID(response.data.cid);
            setImageReady(true);
            successBoolean = true;
          }
          if (fileType === "music") {
            setMusicHash(CryptoJS.SHA256(wordArray).toString());
            setMusicCID(response.data.cid)
            setMusicReady(true);
            successBoolean = true;
          }
          console.log("Media was uploaded.")
        })
        .catch((err) => console.error("Error while uploading file", err));
        if(successBoolean) {
          resolve("(resolve) Successfully uploaded!")
        } else {
          reject("(reject) Error occured while uploading the file!");
        }
    });

    newAction({
      thePromise: uploadPromise, 
      pendingPromiseTitle: "Uploading media...", pendingPromiseDesc: "",
      successPromiseTitle: "File uploaded!", successPromiseDesc: "The file was successfully uploaded",
      errorPromiseTitle: "Couldn't upload file!", errorPromiseDesc: "There was an error while uploading the file. Please try again!"
    });
  }

  function createNFT() {
    /**TEST */ console.log("creatorSplit: ", royaltyPercent); console.log("foreverRoyalties: ", revenues);
    /**TEST */ console.log("artistList: ", artistList);
    /**TEST */ console.log("artistList JSON: ", JSON.stringify(JSON.stringify(artistList)));

    const percentTotal = revenues.reduce((total, item) => {
      return total + item.percent;
    }, 0);
    console.log("percentTotal: ", percentTotal);

    if (!(imageReady && musicReady)) {
      newAction({
        errorMsg: "The image or the music is not ready!", errorDesc: ""
      });
      return;
    }
    if (title.length === 0) {
      newAction({
        errorMsg: "The title can not be empty!", errorDesc: ""
      });
      return;
    }
    if (desc.length === 0) {
      newAction({
        errorMsg: "The description can not be empty!", errorDesc: ""
      });
      return;
    }
    if (price === "0") {
      newAction({
        errorMsg: "You have to set a price!", errorDesc: ""
      });
      return;
    }
    if (percentTotal > 10000) {
      newAction({
        errorMsg: "Total percent is higher then 100%!", errorDesc: "Total forever royalty percent has to be less then 100%!"
      });
      return;
    }
    
    const revenueTable = {
      [window.accountId]: royaltyPercent,
      [vault]: calculateVaultPercent(royaltyPercent)
    };

    const foreverTable = {};
    revenues.map((royaltyEntry) => {
      foreverTable[royaltyEntry.account] = royaltyEntry.percent
    });
    

    const mintPromise = new Promise(async (resolve, reject) => {
      // Save artistList, this is half-manual
      const escapedName = escape(title);
      fetch(`https://daorecords.io:8443/upload/artist_list?list=${JSON.stringify(JSON.stringify(artistList))}&name=${escapedName}`);
      const mintResult = await mintRootNFT(title, desc, imageCID, imageHash, musicCID, musicHash, price, foreverTable, revenueTable);
      if (mintResult) {
        resolve("The mint was successfull (message from promise)");
      } else {
        reject("The mint was not successfull (message from promise)");
      }
    });
    newAction({
      thePromise: mintPromise, 
      pendingPromiseTitle: "Prepairing transaction...", pendingPromiseDesc: "plase wait",
      successPromiseTitle: "Redirecting to transaction", successPromiseDesc: "Please sign the transaction in the next screen!",
      errorPromiseTitle: "Redirecting to transaction", errorPromiseDesc: "Please sign the transaction in the next screen!"
    });
  }

  function calculateVaultPercent(creatorSplit) {
    return 10000 - creatorSplit;
  }

  function addNewRoyaltyEntry() {
    setRevenues((state) => {
      state.push({
        account: "",
        percent: 0,
      })
      return Object.assign([], state);
    });
  }

  function removeRoyaltyEntry(index) {
    if (index === 0 || index === 1) return;
    setRevenues((state) => {
      state.splice(index, 1);
      return Object.assign([], state);
    })
  }

  function changeRoyaltyAccount(index, newName) {
    setRevenues((state) => {
      state[index].account = newName;
      return Object.assign([], state);
    })
  }

  function changeRoyaltyPercent(index, newPercent) {
    if (newPercent > 100) return;
    setRevenues((state) => {
      state[index].percent = Math.ceil(newPercent*100);
      return Object.assign([], state);
    })
  }

  if (!window.wallet.walletSelector.isSignedIn()) return <ConnectWallet />


  return (
    <div id="mynftsBackground">
      <main id="adminMain">
        <h1 id="mainTitle"><p>Mint NFT</p></h1>

        <div id="adminFlexBox" className="adminFlexBox">
          <div id="nft-details" className="nft-details">
            <label className="fieldName">Upload Media</label>
              {!(imageReady || musicReady) ? 
                <MediaDropzone onDrop={(files) => onDropMedia(files)} accept={"image/*, audio/*"} />
                : (
                  <>
                  {imageReady ? 
                    <p className="smallUploader">{image.name}<button onClick={() => setImageReady(false)}>X</button></p> 
                  : 
                    <SmallUploader onDrop={(files) => onDropMedia(files)} accept={"image/*"} /> }
                  {musicReady ? 
                    <p className="smallUploader">{music.name}<button onClick={() => setMusicReady(false)}>X</button></p>
                  : 
                    <SmallUploader onDrop={(files) => onDropMedia(files)} accept={"audio/*"} />}
                  </>
                )
              }
              <div className="infoDiv">
                <img src={infoLogo}></img>
                <p>{"Upload your Audio & Image files here. Make sure your Audio file is in MP3 format and your Image file is a JPG with a 1:1 ratio, not bigger then 500 KB."}</p>
              </div>
            <label className="fieldName">Title</label>
            <input type={"text"} value={title} className="nftTitleInput" onChange={(e) => setTitle(e.target.value)} />
            <div className="infoDiv">
              <img src={infoLogo}></img>
              <p>{"The title of your song goes here"}</p>
            </div>
            <label className="fieldName">Description</label>
            <textarea value={desc} className="descInput" onChange={(e) => setDesc(e.target.value)} maxLength={500} />
            <div className="infoDiv">
              <img src={infoLogo}></img>
              <p>{"In this section provide a short description of your song. Try to keep it to 1 Paragraph."}</p>
            </div>
            
            <label className="fieldName">Creator split
              <button className="royaltyButton" onClick={addNewRoyaltyEntry}>
                <img src={plusButton} alt={'+'}></img>
              </button>
            </label>
            <ul className="royaltyList">
              {revenues.map((royalty, index) => (
                <li className="royaltyElement" key={index}>
                  <div>
                    <label htmlFor="royaltyElementAddress" className="smallRoyaltyLabel">Address</label>
                    <input id="royaltyElementAddress" type={"text"} value={royalty.account} onChange={(e) => changeRoyaltyAccount(index, e.target.value)} disabled={index === 0 || index === 1}></input>
                  </div>
                  <div>
                    <label htmlFor="royaltyElementPercent" className="smallRoyaltyLabel">Percentage</label>
                    <input id="royaltyElementPercent" type={"number"} min={0} max={100} value={royalty.percent / 100} onChange={(e) => changeRoyaltyPercent(index, e.target.value)} disabled={index === 0 || index === 1}></input>
                  </div>
                  <div className="revenueRemoveButtonContainer">
                    <label htmlFor="removeButton" className="placeholderLabel">X</label>
                    <img id="removeButton" src={(index === 0 || index === 1) ? blackXButton : xButton} alt={'X'} onClick={() => removeRoyaltyEntry(index)} disabled={index === 0 || index === 1}></img>
                  </div>
                </li>
              ))}
            </ul>
            <div className="infoDiv">
              <img src={infoLogo}></img>
              <p>{"We have burned in a 15% to DAOrecords DAO and 5% to Record Pool DAO. Below please input the wallet addresses and the associated %s. You can add new entries by the plus button."}</p>
            </div>
            <ArtistList artistList={artistList} setArtistList={setArtistList} />

            <label className="fieldName">Price</label>
            <input type={"number"} min={0} value={price} className="priceInput" onChange={(e) => setPrice(e.target.value)} />
            <div className="infoDiv">
              <img src={infoLogo}></img>
              <p>{"All NFTs are priced in $NEAR. Make sure to check the current price and be aware that this price might fluctuate over time up or down and you won't be able to change it in the future."}</p>
            </div>

          </div>

          <PreviewBox title={title} image={image} music={music} price={price}/>
        </div>

        <div className="buttonContainer">
          <button onClick={createNFT} className="mainButton">Mint</button>
        </div>
      </main>

    </div>
  )
}
