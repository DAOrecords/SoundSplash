import React from 'react';
import plusButton from '../assets/plusButton.svg';
import xButton from '../assets/xButton.svg';
import infoLogo from '../assets/info.svg';


export default function ArtistList({artistList, setArtistList}) {

  const emptyArtistList = {
    name: "",
    telegram: "",
    twitter: "",
    insta: "",
    facebook: "",
    youtube: "",
    website: ""
  }

  function addNewArtist() {
    setArtistList((prevState) => {
      prevState.push(emptyArtistList);
      return Object.assign([], prevState);
    })
  }

  function changeArtistEntry(index, property, value) {
    setArtistList((prevState) => {
      prevState[index][property] = value;
      return Object.assign([], prevState);
    })
  }

  function removeArtist(index) {
    setArtistList((prevState) => {
      prevState.splice(index, 1);
      return Object.assign([], prevState);
    })
  }


  return (
    <>
      <label className="fieldName">
        {"Artist List"}
        <button className="royaltyButton" onClick={addNewArtist}>
          <img src={plusButton} alt={'+'}></img>
        </button>
      </label>
      
      <ul className="artistList">
        {artistList.map((artist, index) => (
          <li className="artistListElement">
            <div className="artistListInputGroup">
              <input 
                value={artist.name} 
                onChange={(e) => changeArtistEntry(index, "name", e.target.value)} 
                placeholder={"Artist Name"}
                className="artistListInput"
              >
              </input>

              <input 
                value={artist.telegram} 
                onChange={(e) => changeArtistEntry(index, "telegram", e.target.value)} 
                placeholder={"Telegram"}
                className="artistListInput"
              >  
              </input>

              <input 
                value={artist.twitter} 
                onChange={(e) => changeArtistEntry(index, "twitter", e.target.value)} 
                placeholder={"Twitter"}
                className="artistListInput"
              >
              </input>

              <input 
                value={artist.insta} 
                onChange={(e) => changeArtistEntry(index, "insta", e.target.value)} 
                placeholder={"Instagram"}
                className="artistListInput"
              >
              </input>

              <input 
                value={artist.facebook} 
                onChange={(e) => changeArtistEntry(index, "facebook", e.target.value)} 
                placeholder={"Facebook"}
                className="artistListInput"
              >
              </input>

              <input 
                value={artist.youtube} 
                onChange={(e) => changeArtistEntry(index, "youtube", e.target.value)} 
                placeholder={"YouTube"}
                className="artistListInput"
              >
              </input>

              <input 
                value={artist.website} 
                onChange={(e) => changeArtistEntry(index, "website", e.target.value)} 
                placeholder={"Website"}
                className="artistListInput"
              >
              </input>
            </div>

            <div className="artistListRemove">
              <label htmlFor="removeButton" className="placeholderLabel">X</label>
              <img src={xButton} alt={'X'} onClick={() => removeArtist(index)}></img>
            </div>
          </li>
        ))}
      </ul>
      <div className="infoDiv">
        <img src={infoLogo}></img>
        <p>{"We created this section for you to provide information about the artist and other contributors to the song your are minting. Please provide the relevant information as you like. Add new entries by the plus button."}</p>
      </div>
    </>
  )
}
