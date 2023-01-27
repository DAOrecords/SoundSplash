import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getBuyableTokens, verify_sha256 } from '../utils';
// import 'regenerator-runtime/runtime';
import Equalizer from './Equalizer';
import SplashLandingGrid from './SplashLandingGrid';
import FooterSplash1 from './FooterSplash1';
import TopMenuSplash1 from './TopMenuSplash1';
import Splash1ObjectContainer from './Splash1ObjectContainer';
import svgBackground from '../assets/splash1svg.svg';


export default function SplashLanding({index, newAction, openGuestBook, setGuestBook, setShowWallet, showWallet}) {
  const screenWidth = window.innerWidth;
  const [nftList, setNftList] = React.useState([]);
  const [image, setImage] = useState(null);
  

  React.useEffect(async () => {    
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('errorCode')) {
      newAction({
        errorMsg: "There was an error while processing the transaction!", errorMsgDesc: urlParams.get('errorCode'),
      }); 
    } else if (urlParams.has('transactionHashes')) {
      newAction({
        successMsg: "Success!", successMsgDesc: "You bought a new NFT!",
      });
    }

    const buyable = await getBuyableTokens();
    const orderedBuyable = buyable.sort(function(a, b) {
      const firstNum = a.token_id.slice(10, a.token_id.lastIndexOf("-"));
      const secondNum = b.token_id.slice(10, b.token_id.lastIndexOf("-"));
      return firstNum - secondNum;
    })
  
    //loadImage(orderedBuyable[index].metadata);
    setNftList(orderedBuyable);
  }, [])


  function loadImage(metadata) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "https://ipfs.io/ipfs/" + metadata.media);
    xhr.responseType = "blob";
    xhr.onload = function() {
      let blob = xhr.response;
      const reader = new FileReader();
      const verifier = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onload = async function(e) {
        const hash_correct = await verify_sha256(blob, metadata.media_hash);
        if (hash_correct) setImage(e.target.result);
        else newAction({
          errorMsg: "There was an error while loading the image!", errorMsgDesc: "The image hash is incorrect.",
        }); 
      }
    }
    xhr.send();
  }

  if (nftList.length === 0) return <p>Loading...</p>

  return (
    <>
      {openGuestBook && ( <GuestBook openModal={openGuestBook} newAction={newAction} setOpenModal={setGuestBook} /> )}
      <ToastContainer position="bottom-right" autoClose={5000} />
      <div id='colorContainer'>
        <div id='svgContainer' style={{ backgroundImage: `url(${svgBackground})` }}>
          <TopMenuSplash1 setShowWallet={setShowWallet} showWallet={showWallet} />

          <main>
            <Equalizer musicCID={JSON.parse(nftList[index].metadata.extra).music_cid} 
              nftStorageLink={"https://bafybeid2ojnkez22otr3aeajs33vnsl7do6vwhsreufzn53zwirjn4lrb4.ipfs.nftstorage.link/"} />
            <Splash1ObjectContainer />
            <SplashLandingGrid 
              tokenId={nftList[index].token_id}
              metadata={nftList[index].metadata}
              image={image}
              newAction={newAction}
            />
          </main>

          {(screenWidth > 1200)&& <FooterSplash1 />}

        </div>
      </div>
    </>
  )
}