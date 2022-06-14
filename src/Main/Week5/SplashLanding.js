import React, { useRef, useState, useEffect} from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getBuyableTokens, verify_sha256 } from '../../utils';
import 'regenerator-runtime/runtime';
import LineVisualizer from './Equalizer';
import SplashLandingGrid from './SplashLandingGrid';
import Footer from './Footer';
import TopMenu from './TopMenu';
import ObjectContainer from './ObjectContainer';
import PlayerControls from './PlayerControls';
import bgVideo from '../../assets/nn36.mp4';


export default function SplashLanding({index, newAction, openGuestBook, setGuestBook, setShowWallet, showWallet}) {
  index = 1;
  const screenWidth = window.innerWidth;
  const [nftList, setNftList] = React.useState([]);  
  const [play, setPlay] = React.useState(false);
  const [wasPaused, setWasPaused] = React.useState(false);
  /**  EXPERMIMENTAL AREA*/
  const canvasRef = useRef(null);
const audioRef = useRef(null);
const [canvasContext, setCanvasContext] = useState(null);
const [audioContext, setAudioContext] = useState(null);
const alpha = "1.0";

React.useEffect(async () => {    
  const urlParams = window.location.search;
  if (urlParams.includes('errorCode')) {
    newAction({
      errorMsg: "There was an error while processing the transaction!", errorMsgDesc: URLSearchParams.get('errorCode'),
    }); 
  } else if (urlParams.includes('transactionHashes')) {
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
    
  useEffect(() => {
    if (!canvasRef.current || !audioRef.current) return;
    console.log("canvasRef ", canvasRef);
    const canvas = canvasRef.current;
    setCanvasContext(canvas.getContext('2d'));

    console.log("audioRef: ", audioRef);
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";                              // Without this, we would have CORS-error
    audio.load();
    audio.volume = 0.5;
  }, [nftList]);
  
  useEffect(() => {
    console.log("play", play)
    if (play) startPlaying();
    if (!play) stopPlaying();
  }, [play])



  
  function connectVisualizer() {
    console.log("Connecting visualizer...")
    audioRef.current.play();

    const audioCtx = new AudioContext();
    setAudioContext(audioCtx);
    console.log(audioContext);
    
    let canvas = canvasRef.current;
    let audioSource = audioCtx.createMediaElementSource(audioRef.current);
    let analyzer = audioCtx.createAnalyser();
    audioSource.connect(analyzer);
    analyzer.connect(audioCtx.destination);
    analyzer.fftSize = 256;                                     // Column number
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
  
    const barWidth = (canvas.width/2)/bufferLength;

    return [canvas, analyzer, bufferLength, dataArray, barWidth];
  }

  function startPlaying() {
    setPlay(true);
    if (wasPaused) {                                         // This will happen when the user pauses -> restarts the audio
      console.log("Start Playing...")
      audioRef.current.play();
      return;
    }
    console.log("canvasContext: ", canvasContext)
    if (canvasContext) {
      console.log("Link", `https://daorecords.io:8443/fetch?cid=${JSON.parse(nftList[index].metadata.extra).music_cid}`)
      const [canvas, analyzer, bufferLength, dataArray, barWidth] = connectVisualizer();
      
      function animate() {
        let fromLeft = 0;
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        analyzer.getByteFrequencyData(dataArray);
        //console.log(dataArray)

        // Left side
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] * 0.9;                // Never hit the top of the canvas
          
          const red = i * barHeight/20;                        // We calculate colors based on the music
          const green = i * 4;                                 // and space-from-left
          const blue = barHeight / 2;
          //console.log(`red: ${red}  green: ${green}  blue: ${blue}`);
          
          canvasContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`
          canvasContext.fillRect((canvas.width/2) - fromLeft, (canvas.height/2) - barHeight, barWidth, barHeight);
          canvasContext.fillRect((canvas.width/2) - fromLeft, (canvas.height/2), barWidth, barHeight);
          fromLeft = fromLeft + barWidth
        }
        // Right side
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] * 0.9;                // Never hit the top of the canvas
          
          const red = i * barHeight/20;                        // We calculate colors based on the music
          const green = i * 4;                                 // and space-from-left
          const blue = barHeight / 2;
          
          canvasContext.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`
          canvasContext.fillRect(fromLeft + barWidth, (canvas.height/2) - barHeight, barWidth, barHeight);
          canvasContext.fillRect(fromLeft + barWidth, (canvas.height/2), barWidth, barHeight);
          fromLeft = fromLeft + barWidth;
        }

        requestAnimationFrame(animate);
      }
      animate();
    }
  }

  function stopPlaying() {
    console.log("stopPlaying...")
    setPlay(false);
    if (!audioRef.current) return;
    audioRef.current.pause();
    setWasPaused(true);
  }
  /** */




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

              <canvas id="lineVisualizer" ref={canvasRef} width={window.innerWidth} height={window.innerHeight} />
              <audio ref={audioRef} src={`https://daorecords.io:8443/fetch?cid=${JSON.parse(nftList[index].metadata.extra).music_cid}`} />

            
            <SplashLandingGrid
              tokenId={nftList[index].token_id}
              metadata={nftList[index].metadata}
              newAction={newAction}
              playing={play}

              startPlaying={startPlaying}
              stopPlaying={stopPlaying}
            />
          </main>

          {(screenWidth > 1200)&& <Footer />}
        </div>
    </>
  )
}