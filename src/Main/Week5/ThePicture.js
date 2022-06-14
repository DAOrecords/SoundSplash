import React from 'react'
import PlayerControls from './PlayerControls'


export default function ThePicture({imageCID, playing, startPlaying, stopPlaying}) {
  let userAgentString = navigator.userAgent;
  let safariAgent = userAgentString.indexOf("Safari") > -1;
  if (userAgentString.indexOf("Chrome") > -1) safariAgent = false;                             // Some browsers are spoofing user agent by adding a string like
  if (userAgentString.indexOf("Firefox") > -1) safariAgent = false;                            // Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36
  console.log("Is Safari? ", safariAgent);

  return (
    <div id='pictureContainer5'>
      <img 
        id="splashPicture5" 
        alt="Picture loading..."
        src={`https://daorecords.io:8443/fetch?cid=${imageCID}`}
      >
      </img>
      <PlayerControls playing={playing} startPlaying={startPlaying} stopPlaying={stopPlaying} />
    </div>
  )
}

