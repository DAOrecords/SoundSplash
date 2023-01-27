import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// import { initContract } from './utils';
import './global.css';
import 'regenerator-runtime/runtime'


import { Wallet } from './near-wallet';

const CONTRACT_ADDRESS = process.env.CONTRACT_NAME;

// When creating the wallet you can optionally ask to create an access key
// Having the key enables to call non-payable methods without interrupting the user to sign
const wallet = new Wallet({ createAccessKeyFor: CONTRACT_ADDRESS });

// Setup on page load
window.onload = async () => {
  const isSignedIn = await wallet.startUp()
  window.wallet = wallet;
  window.contractName = CONTRACT_ADDRESS;

  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );
}
