import React from 'react';
import { utils } from 'near-api-js';
import Buy from './Buy';


export default function Box({tokenId, gen, price, fontSettings, newAction}) {
  const priceInNear = utils.format.formatNearAmount(price);
  const [priceInDollar, setDollar] = React.useState("NaN");

  function formatNumber(number, maxDecimal) {
    return Math.round(number * Math.pow(10,maxDecimal)) / Math.pow(10,maxDecimal)
  }

  React.useEffect(async () => {
    const nearPrice = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT")
    .then((res) => res.json())
    .catch((err) => {
      console.error("Error while fetching NEAR price", err);
      return { price: 0 }
    });
    const dResult = nearPrice.price * priceInNear;
    setDollar(dResult);
  }, [])
  
  const labelStyle = {
    fontFamily: fontSettings.secondFamily,
    fontWeight: "700",
    fontSize: "14px",
    color: fontSettings.color,
    lineHeight: "17px",
    letterSpaceing: "0.05em",
  };
  const nearValueStyle = {
    fontFamily: fontSettings.family,
    color: "#3FFFE8",
    fontWeight: "700",
    fontSize: "20px",
    lineHeight: "24px",
    letterSpacing: "0.05em",
  }
  const genValueStyle = {
    fontFamily: fontSettings.family,
    color: "#29FFD9",
    fontWeight: "700",
    fontSize: "20px",
    lineHeight: "24px",
    letterSpacing: "0.05em",
  }


  return (
    <>
      <div id="splashSmallInfoBox" className="splashInfoElement">
        <div><p className="splashInfoElementFirst week2SplashSmallInfoBoxElement" style={labelStyle}>GENERATION</p></div>
        <div className="splashSmallInfoBoxNearPrice noFlexBasis"><p className="week2SplashSmallInfoBoxElement" style={genValueStyle}>#{gen}</p></div>
        <div className="splashInfoElementBreak"></div>
        <div className="week2SplashSmallInfoBoxElement"><p style={labelStyle}>PRICE</p></div>
        <div className="splashSmallInfoBoxNearPrice noFlexBasis"><p className="week2SplashSmallInfoBoxElement" style={nearValueStyle}>{formatNumber(priceInNear,3)} NEAR</p></div>
        <div className="splashInfoElementBreak"></div>
      </div>
      
    </>
  )
}
