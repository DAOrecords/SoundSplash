import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getBuyableTokens, verify_sha256 } from '../../utils';
// import 'regenerator-runtime/runtime';
import LineVisualizer from './Equalizer';
import SplashLandingGrid from './SplashLandingGrid';
import Footer from './Footer';
import TopMenu from './TopMenu';
import ObjectContainer from './ObjectContainer';
import PlayerControls from './PlayerControls';
import bgVideo from '../../assets/nn36.mp4';


export default function SplashLanding({index, newAction, openGuestBook, setGuestBook, setShowWallet, showWallet}) {
  const screenWidth = window.innerWidth;
  const [nftList, setNftList] = React.useState([]);  
  const [play, setPlay] = React.useState(false);

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
  
    setNftList(orderedBuyable);
  }, [])

  if (nftList.length === 0) return <p>Loading...</p>


  return (
    <>
      {openGuestBook && ( <GuestBook openModal={openGuestBook} newAction={newAction} setOpenModal={setGuestBook} /> )}
      <ToastContainer position="bottom-right" autoClose={5000} />
        <div id='svgContainer'>
          <video id="splash5BackgroundVideo" autoPlay loop muted style={{ background: "#000000" }}>
            <source src={bgVideo} type="video/mp4" />
          </video>
          <TopMenu setShowWallet={setShowWallet} showWallet={showWallet} />

          <main>
            <LineVisualizer musicCID={JSON.parse(nftList[index].metadata.extra).music_cid} play={play} />
            <ObjectContainer />
            
            <SplashLandingGrid
              tokenId={nftList[index].token_id}
              metadata={nftList[index].metadata}
              newAction={newAction}
              playing={play}
              setPlay={setPlay}
            />
          </main>

          {(screenWidth > 1200)&& <Footer />}
        </div>
    </>
  )
}