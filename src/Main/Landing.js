import React, { useEffect, useState } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './Footer';
import TopMenu from './TopMenu';
import { getListForAccount, getNextBuyableInstance, getNftDetailsForList, getNftListWithThumbnails, getNumberOfNfts } from '../utils';
import artistLists from '../artistLists.json';
import { useNavigate } from 'react-router-dom';
import Cd1 from '../assets/cd1.png';
import Cd2 from '../assets/cd2.png';
import Player from './Player';
import StorefrontNftCard from './StorefrontNftCard';


export default function Landing({newAction, openGuestBook, setGuestBook, setShowWallet, showWallet}) {
  const [list, setList] = useState([]);
  const [nftPages, setNftPages] = useState([]);
  const [renderNonce, setRenderNonce] = useState(-1);
  const [selectedPage, setSelectedPage] = useState(0);
  const [filters, setFilters] = useState(mockFilters);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [playerVisible, setPlayerVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  const twoSide = 128;                                              // The 2 side margin is 64px + 64px = 128px
  const cardWidth = 301;                                            // Width of one NftCard
  const availSpace = window.innerWidth - twoSide - 3;                   
  let cardGap = 20;                                                 // cardGap starts at 20px, it can't be smaller then that
  let cardFitCount = 2;                                             // How many NftCard will fit

  let total = (cardFitCount-1)*(cardWidth+cardGap) + cardWidth;
  while (total < availSpace) {                                      // We calculate the gap between the card and how much card should be displayed in one page
    if ((availSpace - total) < cardWidth) {
      cardGap++;
    } else {
      cardFitCount++;
    }
    total = (cardFitCount-1)*(cardWidth+cardGap) + cardWidth;
  }

  const liMargin = {
    marginRight: `${cardGap}px`
  }


  useEffect(async () => {
    // We should use `start` and `pageSize` in the future
    const nftList = await getNftListWithThumbnails();
    const rootNftCount = await getNumberOfNfts();

    let nPages = [];
    let page = 0;
    for (let i = 0; i < nftList.length; i = i + cardFitCount) {
      nPages[page] = nftList.slice(i, i+cardFitCount);
      page++;
    }
    
    setList(nftList);
    setNftPages(() => {
      return Object.assign([], nPages);
    });
  }, []);
  
  useEffect(async () => {
    if (selectedPage === null) return;
    if (renderNonce <= 0) {
      // Trying to hack around the state update problem. 
      // If renderNonce is smaller then 0, nftPages is not loaded, if it is bigger then 1, data from blockchain is being loaded, or loaded
      if (nftPages.length > 0) setRenderNonce(3);
      else {
        setTimeout(() => setRenderNonce(renderNonce-1), 1000);
      }
      return;
    } else {
      if (nftPages[selectedPage][0].loaded) {
        console.log(`All data loaded (page ${selectedPage}) `, renderNonce);
      } else {
        let newPage = nftPages[selectedPage];
        const oldPage = newPage;
        oldPage.map(async (sqlNft) => {
          const next = await getNextBuyableInstance(sqlNft.contract, sqlNft.root_nft);
          const responseList = await getNftDetailsForList(sqlNft.contract, [ next ]);
          // Do artistList here
          const singleNft = responseList[0];
          
          const index = newPage.findIndex((current) => {
            const currentUniqId = current.contract + current.root_nft;
            const searchedUniqId = sqlNft.contract + sqlNft.root_nft;
            return currentUniqId === searchedUniqId;
          });
          newPage[index] = { ...newPage[index], ...singleNft, loaded: true};
          console.log("newPage", newPage)
        });
        setNftPages((prev) => {
          prev[selectedPage] = newPage;
          return Object.assign([], prev);
        });
        setTimeout(() => setRenderNonce(renderNonce+1), 1000);
      }
    };
    
    
  }, [selectedPage, renderNonce]);



  function playClicked(index, event) {
    event.stopPropagation();
    setPlayerVisible(true);
    setSelectedSong(index);
  }


  return (
    <>
      {openGuestBook && ( <GuestBook openModal={openGuestBook} newAction={newAction} setOpenModal={setGuestBook} /> )}
      <ToastContainer hideProgressBar={true} position="bottom-right" transition={Slide} />

      <div id="mynftsBackground">
        <TopMenu setShowWallet={setShowWallet} showWallet={showWallet} />
        
        <main id="mynftsGrid">
          {selectedPage !== null ? 
            <>
              <h1 id="mynftsTitle">
                <img src={Cd1} alt={''}></img>
                <p>Store</p>
                <img src={Cd2} alt={''}></img>
              </h1>
              <ul id="mynftsFilterBar" role={"menubar"}>
                {false && filters.map((filter, index) => (
                  <li 
                    key={"filter-" + index}
                    className="mynftsFilter"
                    onClick={() => setSelectedFilter(index)}
                  >
                    <p>{filter.name}</p>
                  </li>
                ))}
              </ul>
              <ul id="mynftsList">
                {nftPages[selectedPage] && nftPages[selectedPage].map((item, i) => (
                  <li key={"nftCard-li-" + i + "-" + renderNonce} className="myNftsCard" style={((i+1) % cardFitCount) ? liMargin : null}>
                    <StorefrontNftCard
                      key={"nftCard-" + i + "-" + renderNonce}
                      openTransfer={() => openTransfer(item.contract, item.token_id)} 
                      index={(selectedPage*cardFitCount)+i} 
                      picture={"data:image/webp;base64," + item.thumbnail}
                      tokenId={item.token_id}
                      newAction={newAction}
                      contract={item.contract}
                      metadata={item.metadata}
                      playClicked={playClicked}
                    />
                  </li>
                ))}
              </ul>
              <ul id="mynftsPagination">
                {nftPages && nftPages.map((_page, index) => (
                  <li 
                    key={"pageButton-" + index} 
                    className={selectedPage === index ? "mynftsPageButton mynftsPageButtonSelected" : "mynftsPageButton"}
                    onClick={() => setSelectedPage(index)}
                  >
                    {index+1}
                  </li>
                ))}
              </ul>
            </>
          :
            <h1 id="mynftsTitle">Loading NFTs...</h1>
          }  
        </main>

        <Footer />
      </div>

      {playerVisible && (
        <Player 
          list={list}
          selectedSong={selectedSong}
          setSelectedSong={setSelectedSong}
          color={"#FF0000"}
        />
      )}
    </>
  );
}


const mockFilters = [
  {
    name: "SoundSplash"
  }, {
    name: "Archive"
  }, {
    name: "Independent"
  }
]