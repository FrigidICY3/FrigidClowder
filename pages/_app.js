// import '../styles/globals.css';
import '../styles/main.css';

import React, { useEffect, useRef, useState, createContext } from "react";
import Web3Modal from "web3modal";
import { Contract, providers, utils } from "ethers";

import Layout from '../components/Layout.js';
import WalletContext from "../components/WalletContext";

function MyApp({ Component, pageProps }) {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // keep track of the owner address
  const walletAddress = useRef();
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // wallet keep track of which wallet the user is using (Metamask, walletConnect ....)
  const signerRef = useRef();
  // networkRef keep track of which network the user want to use (mainnet, rinkbey, ropsten, polygon, mumbai ....)
  const networkRef = useRef("Ropsten");
  // chainIdRef keep track of the chainId of the current networkRef
  const chainIdRef = useRef(3);
  // ENS
  const [ens, setENS] = useState("");


  /*
      connectWallet: Connects the MetaMask wallet
    */
  const connectWallet = async (_web3Modal = web3ModalRef) => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      signerRef.current = await getProviderOrSigner(true, _web3Modal);
      setWalletConnected(true);
      walletAddress.current = signerRef.current.provider.provider.selectedAddress;
      // console.log(walletAddress.current);
      let _ens = await signerRef.current.provider.lookupAddress(walletAddress.current);
      // console.log(_ens);
      if (_ens) {
        setENS(_ens);
      }

    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false, _web3Modal = web3ModalRef) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await _web3Modal.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const signerT = web3Provider.getSigner();
    // register the current user network
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== chainIdRef.current) {
      window.alert("Change the network to Ropsten");
      throw new Error("Change network to Ropsten");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: networkRef.current,
        providerOptions: {},
        disableInjectedProvider: false,
      });
    }
    connectWallet();

  }, [walletConnected, ens]);

  return (
    <WalletContext.Provider value={{
      walletConnected,
      walletAddress,
      web3ModalRef,
      signerRef,
      networkRef,
      chainIdRef,
      ens,
    }}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WalletContext.Provider>
  )
}

export default MyApp;