import React, { useEffect, useState } from 'react';
import { ToastContainer, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Footer from './Footer';
import TopMenu from './TopMenu';
import { getListForAccount, getNftDetailsForList } from '../utils';
import NftCard from './NftCard';
import artistLists from '../artistLists.json';
import { useNavigate } from 'react-router-dom';
import Cd1 from '../assets/cd1.png';
import Cd2 from '../assets/cd2.png';
import Player from './Player';


export default function MyNFTs({newAction, openGuestBook, setGuestBook, setShowWallet, showWallet}) {
  const [list, setList] = useState([]);
  const [nftPages, setNftPages] = useState([]);
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
  
  let navigate = useNavigate();

  useEffect(async () => {
    // Get the list of NFTs the user owns, from the server
    const nftList = await getListForAccount();
    console.log("nftList", nftList);

    let nftDetailsLists = nftList.filter((nftItem, index) =>                                  // This will contain multiple lists, each element of the array is a contract
                            nftList.findIndex(nftObj => nftObj.contract === nftItem.contract) === index)
                                    .map((item) => {return { contract: item.contract, nftDetailsList: null }});

    for (let i = 0; i < nftDetailsLists.length; i++) {
      const contract = nftDetailsLists[i].contract;
      const list = nftList.filter((nft) => nft.contract === contract)
                          .map(nft => nft.nft_id);

      nftDetailsLists[i].nftDetailsList = await getNftDetailsForList(contract, list);
    }
    console.log("nftDetailsLists", nftDetailsLists)

    const mergedNftList = nftList.map((nftItem, i) => {
      const correspondingList = nftDetailsLists.filter((currentList) => currentList.contract === nftItem.contract)[0].nftDetailsList;
      const correspondingDetails = correspondingList.filter((currentNft) => currentNft.token_id === nftItem.nft_id)[0];
      const newObj = { ...nftItem, ...correspondingDetails };
      return newObj;
    });

    console.log("mergedNftList: ", mergedNftList)

    let nPages = [];
    let page = 0;
    for (let i = 0; i < mergedNftList.length; i = i + cardFitCount) {
      nPages[page] = mergedNftList.slice(i, i+cardFitCount);
      page++;
    }
    console.log("nftPages: ", nPages);


    setNftPages(nPages);
    setList(mergedNftList);
  }, []);


  function openTransfer(contract, tokenId) {
    navigate('/contract/nfts/' + contract + '/' + tokenId);
  }

  function getArtistIndex(tokenId) {
    console.log("tokenId inside getArtistIndex: ", tokenId);

    /** We will manually need to update this list throughout the SoundSplash */
    if (tokenId.includes('fono-root-0-') || tokenId === 'fono-root-0') return 2;
    if (tokenId.includes('fono-root-2-') || tokenId === 'fono-root-2') return 0;
    if (tokenId.includes('fono-root-3-') || tokenId === 'fono-root-3') return 1;
    if (tokenId.includes('fono-root-4-') || tokenId === 'fono-root-4') return 3;
    if (tokenId.includes('fono-root-5-') || tokenId === 'fono-root-5') return 4;
    if (tokenId.includes('fono-root-6-') || tokenId === 'fono-root-6') return 5;
    if (tokenId.includes('fono-root-7-') || tokenId === 'fono-root-7') return 6;
    if (tokenId.includes('fono-root-8-') || tokenId === 'fono-root-8') return 7;
    if (tokenId.includes('fono-root-9-') || tokenId === 'fono-root-9') return 8;
    if (tokenId.includes('fono-root-10-') || tokenId === 'fono-root-10') return 9;
    if (tokenId.includes('fono-root-11-') || tokenId === 'fono-root-11') return 11;
    if (tokenId.includes('fono-root-12-') || tokenId === 'fono-root-11') return 12;
    if (tokenId.includes('fono-root-13-') || tokenId === 'fono-root-11') return 13;
    return 10;
  }

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
          {nftPages[selectedPage] ? 
            <>
              <h1 id="mynftsTitle">
                <img src={Cd1} alt={''}></img>
                <p>My NFTs</p>
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
                  <li key={"nftCard-" + i} className="myNftsCard" style={((i+1) % cardFitCount) ? liMargin : null}>
                    <NftCard 
                      artistList={artistLists[getArtistIndex(item.token_id)]}
                      openTransfer={() => openTransfer(item.contract, item.token_id)} 
                      index={(selectedPage*cardFitCount)+i} 
                      tokenId={item.token_id}
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
            <h1 id="mynftsTitle">You don't have any NFTs yet!</h1>
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