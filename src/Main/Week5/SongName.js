import React from 'react'


export default function SongName({title, image}) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const overflow = ((screenHeight < 814) && (screenWidth > 1200)) ? true : false;

  const style = {
    fontFamily: "Inter",
    fontWeight: "normal",
    lineHeight: "84px",
    letterSpacing: "0.01em",
    textTransform: "uppercase"
  }

  const plc = {
    marginLeft: "0 !important",
    width: "100%",
    marginLeft: 0,
    marginTop: "-100px",
    marginBottom: "-150px",
  }


  if (!overflow) {
    return (
      <div id="splashTitleWeek5">
        <img src={image} alt={title} />
      </div>
    )
  } else {
    return (
      <div id="splashTitleWeek5">
        <img src={image} alt={title} style={plc} />
      </div>
    )
  }
}
