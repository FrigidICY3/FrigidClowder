import Head from "next/head";
import styles from "../../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract, logger, BigNumber } from "ethers";
import { useContext, useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, WHITELIST_ABI } from "../../constants/whitelist";
import WalletContext from "../../components/WalletContext";

export default function Whitelist() {
  // joinedWhitelist keeps track of whether the current metamask address has joined the Whitelist or not
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // numberOfWhitelisted tracks the number of addresses's whitelisted
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);

  const wallet = useContext(WalletContext);

  /**
   * addAddressToWhitelist: Adds the current connected address to the whitelist
   */
  const addAddressToWhitelist = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = wallet.signerRef.current;
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        WHITELIST_ABI,
        signer
      );
      // call the addAddressToWhitelist from the contract
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // get the updated number of addresses in the whitelist
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getNumberOfWhitelisted:  gets the number of whitelisted addresses
   */
  const getNumberOfWhitelisted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = wallet.signerRef.current;
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        WHITELIST_ABI,
        provider
      );
      // call the numAddressesWhitelisted from the contract
      const _numberOfWhitelisted = await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(parseInt(_numberOfWhitelisted._hex, 16));
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfAddressInWhitelist: Checks if the address is in whitelist
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      // We will need the signer later to get the user's address
      // Even though it is a read transaction, since Signers are just special kinds of Providers,
      // We can use it in it's place

      const signer = wallet.signerRef.current;
      // console.log(wallet.signerRef.current);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        WHITELIST_ABI,
        signer
      );
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      // call the whitelistedAddresses from the contract
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );

      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };


  /*
    renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    if (wallet.walletConnected) {
      if (joinedWhitelist) {
        return (
          <div>
            <div className="text-sm md:text-xl lg:text-2xl leading-5 mx-3 mt-6">
              <b>{numberOfWhitelisted}</b> have already joined the Whitelist and you are sir one of the luckiest 🎉
            </div>

            <div className="text-sm md:text-xl lg:text-2xl leading-5 mx-3 mt-6">
              You have garenteed a spot in the Clowder! 🥳
            </div>
          </div>
        );
      } else if (loading) {
        return <button className="lg:w-auto w-full p-3 m-3 mt-7 rounded text-white font-bold bg-blue-600">Loading...</button>;
      } else {
        return (
          <div>
            <div className="text-sm md:text-xl lg:text-2xl leading-5 mx-3 mt-6">
              Heyyy 🎉{wallet.walletAddress.current &&
                <span className="text-cyan-500">
                  &nbsp;{wallet.walletAddress.current.substring(0, 8)}&nbsp;
                </span>}🎉 <b> 33 Limited </b> Spots to whitelist! GET YOURS!
            </div>

            <button onClick={addAddressToWhitelist} className="lg:w-auto w-full p-3 m-3 mt-7 rounded text-white font-bold bg-blue-600">
              Join the Whitelist
            </button>
          </div>
        );
      }
    } else {
      // checkIfAddressInWhitelist();
      return (
        <div>
          <div className="text-sm md:text-xl lg:text-2xl leading-5 mx-3 mt-6">
            <b>Limited</b> Spots to whitelist! Join now!
          </div>

          <button className="lg:w-auto w-full p-3 m-3 mt-7 rounded text-white font-bold bg-blue-600">
            Connect your wallet
          </button>
        </div>
      );
    }
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // console.log(wallet.walletConnected);
    if (wallet.walletConnected) {
      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    }
  }, [wallet.walletConnected]);

  return (
    <>
      <div className="min-h-[80vh] flex flex-row justify-center items-center">
        <div>
          <h1 className="text-sm font-bold md:text-2xl lg:text-4xl mx-3">Get yourself into the firigid 🧊 Clowder!</h1>
          <div className="text-sm md:text-xl lg:text-2xl leading-5 mx-3 mt-6">
            The special NFT collection for the special developers in Crypto.
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./14.svg" />
        </div>
      </div>
    </>
  );
}
