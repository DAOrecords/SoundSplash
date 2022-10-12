import React, { useEffect, useState } from 'react';
import { utils } from 'near-api-js';
import nearLogo from '../assets/ic_near.svg';
import placeholder from '../assets/DaoLogo.svg';
import playIcon from '../assets/play.svg';
import { buyNFTfromVault } from '../utils';


export default function StorefrontNftCard({newAction, playClicked, artistList, index, metadata = defaultMeta, picture = null, tokenId, contract}) {
  const extra = JSON.parse(metadata.extra);
  const priceInNear = utils.format.formatNearAmount(extra.original_price);

  function formatNumber(number, maxDecimal) {
    return Math.round(number * Math.pow(10,maxDecimal)) / Math.pow(10,maxDecimal)
  }

  function buyNFT() {
    if (!window.accountId) {
      newAction({
        errorMsg: "You are not logged in to NEAR. Please connect your wallet first!", errorMsgDesc: "",
      }); 
      return;
    }

    const buyPromise = new Promise(async (resolve, reject) => {
      window.history.pushState({}, document.title, "/" + `?contract=${contract}`);
      const buyResult = await buyNFTfromVault(contract, tokenId, extra.original_price);
      if (buyResult) {
        resolve("Buying the NFT was successul (message from promise)");
      } else {
        reject("Buying the NFT was not successul (message from promise)");
      }
    });
    newAction({
      thePromise: buyPromise, 
      pendingPromiseTitle: "Prepairing transaction...", pendingPromiseDesc: "plase wait",
      successPromiseTitle: "Redirecting to transaction", successPromiseDesc: "Please sign the transaction in the next screen!",
      errorPromiseTitle: "Redirecting to transaction", errorPromiseDesc: "Please sign the transaction in the next screen!"
    });
  }

  
  return (
    <>
      <button className="nftCard">
        <div className="nftCardImageContainer">
          <img src={picture} alt={'nft-image'} loading={"lazy"}></img>
          <img src={playIcon} alt={'P'} className="nftCardPlay" onClick={(e) => playClicked(index, e)}></img>
        </div>
        <div className="nftCardInfo">
          <p className="nftCardInfoTitle">
            {metadata.title}
          </p>
          <ul className="nftCardArtistList">
            not implemented
            {false && artistList.map((artist, i) => (
              <li key={"artist-" + i} className="nftCardArtistListElement">
                <img src={placeholder} alt={''}></img>
                <p>@{artist.name}</p>
              </li> 
            ))}
          </ul>
          <div className="nftCardInfoBox">
            <p className="nftCardGen">Gen #{extra.generation}</p>
            <p className="nftCardNearPrice">{formatNumber(priceInNear,3)}</p>
            <img src={nearLogo} alt={'N'}></img>
          </div>
          <div className="nftCardButtons">
            {tokenId && <button onClick={buyNFT}>Buy</button>}
          </div>
        </div>
      </button>
    </>
  )
}

const defaultMeta = {
  title: "loading...",
  extra: "{\"generation\":0,\"original_price\":\"0\"}"
}