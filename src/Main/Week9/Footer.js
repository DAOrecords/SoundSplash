import React from 'react';
import DaoLogo from '../../assets/DaoLogoSplash3.svg';
import RealityChain from '../../assets/RealityChainSplash2.svg';
import CryptoVoxels from '../../assets/CryptoVoxelsSplash2.svg';
// import 'regenerator-runtime/runtime';

/** Footer for Week9 */
export default function Footer() {
  return (
    <footer>
      <ul>
        <li>
          <a href={'https://www.daorecords.org/'}>
            <img src={DaoLogo} alt={'DAOrecords'} />
          </a>
        </li>
        <li>
          <a href={'https://near.realitychain.io/2dcity/index.html?pos=x-192y-32'} >
            <img src={RealityChain} alt={'RealityChain'} />
          </a>
        </li>
        <li>
          <a href={'http://bit.ly/SoundSplashSpace'}>
            <img src={CryptoVoxels} alt={'CryptoVoxels'} />
          </a>
        </li>
      </ul>
    </footer>
  )
}
