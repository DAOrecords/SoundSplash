import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import hamburger from '../assets/hamburger.svg'
import 'regenerator-runtime/runtime';
import Wallet from './WalletSplash1';
import logo from '../assets/SoundSplashLogo.svg'


/** Top Menu for Main */
export default function TopMenuSplash1({setShowWallet, showWallet}) {
  const screenWidth = window.innerWidth;
  const [menuOpen, setMenuOpen] = useState(false);
  const [splashMenuOpen, setSplashMenuOpen] = useState(false);

  function hamburgerClicked() {
    setMenuOpen(!menuOpen);
    setShowWallet(false);
  }

  function splashDropdownClicked() {
    setSplashMenuOpen(!splashMenuOpen);
    setShowWallet(false);
  }


  if (screenWidth < 1200) {                               // This is the hamburger view
    return (
      <>
        <nav id="splash-1-nav">
          <button onClick={hamburgerClicked} className="hamburgerIcon">
            <img src={hamburger} alt='Menu'></img>
          </button>
          <Wallet 
            setShowWallet={setShowWallet}
            showWallet={showWallet}
            setMenuOpen={setMenuOpen}
            setSplashMenuOpen={setSplashMenuOpen}
          />
        </nav>

        {menuOpen && (
          <div id="dropdownContainer" className="mobileDropdownContainer">
              <Link to={'/my-nfts'} className="hamburgerElement">MY NFTS</Link>
              {/** List of the drops, we will append this as we go */}
              <Link to={'/weektwo'} className="controlsButton hamburgerElement">Week Two</Link>
              <Link to={'/weekthree'} className="controlsButton hamburgerElement">Week Three</Link>
              <Link to={'/weekfour'} className="controlsButton hamburgerElement">Week Four</Link>
              <Link to={'/weekfive'} className="controlsButton hamburgerElement">Week Five</Link>
              <Link to={'/weeksix'} className="controlsButton hamburgerElement">Week Six</Link>
              <Link to={'/weekseven'} className="controlsButton hamburgerElement">Week Seven</Link>
              <Link to={'/weekeight'} className="controlsButton hamburgerElement">Week Eight</Link>
              <Link to={'/weeknine'} className="controlsButton hamburgerElement">Week Nine</Link>
              <Link to={'/weekten'} className="controlsButton hamburgerElement">Week Ten</Link>
              <Link to={'/weekeleven'} className="controlsButton hamburgerElement">Week Eleven</Link>
              <Link to={'/weektwelve'} className="controlsButton hamburgerElement">Week Twelve</Link>
          </div>
        )}
      </>
    )
  } else {                                                // This is the normal view
    return (
      <nav id="splash-1-nav">
        <div className='splashLogo'>
          <img src={logo} alt={'SoundSplash'} />
        </div>
        <Link to={''} className="controlsButton menuButton"></Link>
        <button onClick={splashDropdownClicked} className="controlsButton menuButton">SPLASH DROPS</button>
        <Link to={'/my-nfts'} className="controlsButton menuButton">MY NFTS</Link>

        {splashMenuOpen && (
          <div id="popupWrapper" onClick={() => setSplashMenuOpen(false)}>
            <div id="dropdownContainer"  onClick={(e) => e.stopPropagation()}>
              {/** List of the drops, we will append this as we go */}
              <Link to={'/weektwo'} className="controlsButton menuButton">Week Two</Link>
              <Link to={'/weekthree'} className="controlsButton menuButton">Week Three</Link>
              <Link to={'/weekfour'} className="controlsButton menuButton">Week Four</Link>
              <Link to={'/weekfive'} className="controlsButton menuButton">Week Five</Link>
              <Link to={'/weeksix'} className="controlsButton menuButton">Week Six</Link>
              <Link to={'/weekseven'} className="controlsButton menuButton">Week Seven</Link>
              <Link to={'/weekeight'} className="controlsButton menuButton">Week Eight</Link>
              <Link to={'/weeknine'} className="controlsButton menuButton">Week Nine</Link>
              <Link to={'/weekten'} className="controlsButton menuButton">Week Ten</Link>
              <Link to={'/weekeleven'} className="controlsButton menuButton">Week Eleven</Link>
              <Link to={'/weektwelve'} className="controlsButton menuButton">Week Twelve</Link>
            </div>
          </div>
        )}

        <Wallet 
          setShowWallet={setShowWallet}
          showWallet={showWallet}
          setMenuOpen={setMenuOpen}
          setSplashMenuOpen={setSplashMenuOpen}
        />
      </nav>
    )
  }
  
}