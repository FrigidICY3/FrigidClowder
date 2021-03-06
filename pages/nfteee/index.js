import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useContext, useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { NFTEEE_ABI, NFT_CONTRACT_ADDRESS } from "../../constants/nfteee";
import styles from "../../styles/Home.module.css";
import WalletContext from "../../components/WalletContext";

export default function NFTEEE(props) {
  // walletConnected keep track of whether the user's wallet is connected or not
  // const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted keeps track of whether the presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // wallet general context
  const wallet = useContext(WalletContext);

  /**
 * startPresale: starts the presale for the NFT Collection
 */
  const startPresale = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = wallet.signerRef.current;
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFTEEE_ABI,
        signer
      );
      // call the startPresale from the contract
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // set the presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfPresaleStarted: checks if the presale has started by quering the `presaleStarted`
   * variable in the contract
   */
  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = wallet.signerRef.current;
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFTEEE_ABI, provider);
      // console.log("NFT Contract: ", await nftContract.presaleStarted());
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();

      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * checkIfPresaleEnded: checks if the presale has ended by quering the `presaleEnded`
   * variable in the contract
   */
  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = wallet.signerRef.current;
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFTEEE_ABI, provider);
      // call the presaleEnded from the contract
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * getOwner: calls the contract to retrieve the owner
   */
  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = wallet.signerRef.current;
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFTEEE_ABI, provider);
      // call the owner function from the contract
      const _owner = await nftContract.owner();
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = wallet.signerRef.current;
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = wallet.signerRef.current;
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFTEEE_ABI, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * presaleMint: Mint an NFT during the presale
   */
  const presaleMint = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = wallet.signerRef.current;
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFTEEE_ABI,
        signer
      );

      // call the _price automatically generated get function to get the price of the token
      let price = await nftContract._price();
      await price;

      // call the presaleMint from the contract, only whitelisted addresses would be able to mintu
      const tx = await nftContract.preSaleMint({
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: price,
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * publicMint: Mint an NFT after the presale
   */
  const publicMint = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = wallet.signerRef.current;
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFTEEE_ABI,
        signer
      );
      // call the _price automatically generated get function to get the price of the token
      let price = await nftContract._price();
      await price;

      // call the mint from the contract to mint the Crypto Dev
      const tx = await nftContract.mint({
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: price,
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  /*
      renderButton: Returns a button based on the state of the dapp
    */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!wallet.walletConnected) {
      return (
        <button className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a frigid NFTEEE ????
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint ????
          </button>
        </div>
      );
    }

    // If presale started and has ended, its time for public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint ????
        </button>
      );
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (wallet.walletConnected) {
      const doAsync = async () => {
        // Check if presale has started and ended
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          await checkIfPresaleEnded();
        }

        await getTokenIdsMinted();
      };

      doAsync();

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [wallet.walletConnected]);

  return (
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
        <div className={styles.description}>
          Its an NFT collection for developers in Crypto.
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/303 have been minted
        </div>
        {renderButton()}
      </div>
      <div>
        <img className={styles.image} src="./14.svg" />
      </div>
    </div>
  );
}