import React from 'react'
import { buyNFTfromVault } from '../../utils';

export default function Buy({tokenId, price, newAction, fontSettings}) {
  const style = {
    //fontFamily: fontSettings.family,
    fontFamily: fontSettings.family,
    color: fontSettings.color,
    fontSize: fontSettings.buttonSize,
    fontWeight: "700",
    lineHeight: "19px",
    letterSpacing: "0.05em",
    color: "#333333",
  }

  function buyNFT() {
    if (!window.accountId) {
      newAction({
        errorMsg: "You are not logged in to NEAR. Please connect your wallet first!", errorMsgDesc: "",
      }); 
      return;
    }

    const buyPromise = new Promise(async (resolve, reject) => {
      const buyResult = await buyNFTfromVault(tokenId, price);
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
    <div id="splashBuy3"  className="splashSmallInfoBoxElement">
      <button  onClick={buyNFT} style={style}>
          BUY
      </button>
    </div>
  )
}
