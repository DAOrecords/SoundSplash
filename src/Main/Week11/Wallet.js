import React from 'react';
import { login, logout, getBalance } from '../../utils';


export default function Wallet({setShowWallet, showWallet, transparent, setMenuOpen, setSplashMenuOpen}) {
  const [balance, setBalance] = React.useState("NaN");
  const [dollar, setDollar] = React.useState("NaN");

  React.useEffect(async () => {
    const result = await getBalance();
    setBalance(result);
    const nearPrice = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT")
      .then((res) => res.json())
      .catch((err) => {
        console.error("Error while fetching NEAR price", err);
        return { price: 0 }
      });
    const dResult = nearPrice.price * result;
    setDollar(dResult);
  }, [])

  function formatNumber(number, maxDecimal) {
    return Math.round(number * Math.pow(10,maxDecimal)) / Math.pow(10,maxDecimal)
  }

  function badgeClicked() {
    setSplashMenuOpen(false);
    setMenuOpen(false);
    setShowWallet(!showWallet);
  }

  function disconnectClicked() {
    logout();
    setShowWallet(false);
  }

  if (!window.wallet.walletSelector.isSignedIn()) {
    return (
      <>
        <div className="controls controlsLast">
          <button onClick={login}  className="mainWalletBadge Week2Wallet InterButton">Connect Wallet</button>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="controls controlsLast">
          <button className={transparent ? "mainWalletBadge Week2Wallet mainWalletBadgeTransparent InterButton" : "mainWalletBadge Week2Wallet InterButton"}
            onClick={badgeClicked}
          >
            {window.accountId}
          </button>
        </div>

        {showWallet && (
          <div id="popupWrapper" onClick={() => setShowWallet(false)}>
            <div id="wallet" className="mainWalletContainer" onClick={(e) => e.stopPropagation()}>
              <div id="mainWalletBalanceFlex">
                <p>BALANCE</p>
                
                <p className="walletFlexPlaceholder"></p>
                <p>{formatNumber(balance, 3)}</p>
              </div>            
              <div id="mainWalletDollarFlex">
                <p className="walletFlexPlaceholder"></p>
                <p>~ ${formatNumber(dollar, 2)}</p>
              </div>
              <div id="mainWalletButtonContainer">
                <button onClick={disconnectClicked} id="mainDisconnect">DISCONNECT</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
}