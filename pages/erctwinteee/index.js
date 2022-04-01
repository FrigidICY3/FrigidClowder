import { BigNumber, Contract, providers, utils } from "ethers";
import React, { useContext, useEffect, useRef, useState } from "react";
// import Web3Modal from "web3modal";
import {
    TOKEN_CONTRACT_ABI,
    TOKEN_CONTRACT_ADDRESS,
} from "../../constants/erctwenteee.js";

import {
    NFT_CONTRACT_ADDRESS,
    NFTEEE_ABI,
} from "../../constants/nfteee"

import styles from "../../styles/Home.module.css";

import WalletContext from "../../components/WalletContext";

export default function Home() {
    // Create a BigNumber `0`
    const zero = BigNumber.from(0);
    // walletConnected keeps track of whether the user's wallet is connected or not
    // const [walletConnected, setWalletConnected] = useState(false);
    // loading is set to true when we are waiting for a transaction to get mined
    const [loading, setLoading] = useState(false);
    // tokensToBeClaimed keeps track of the number of tokens that can be claimed
    // based on the Crypto Dev NFT's held by the user for which they havent claimed the tokens
    const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
    // balanceOfCryptoDevTokens keeps track of number of Crypto Dev tokens owned by an address
    const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(
        zero
    );
    // amount of the tokens that the user wants to mint
    const [tokenAmount, setTokenAmount] = useState(zero);
    // tokensMinted is the total number of tokens that have been minted till now out of 10000(max total supply)
    const [tokensMinted, setTokensMinted] = useState(zero);
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    // const web3ModalRef = useRef();
    const wallet = useContext(WalletContext);

    /**
     * getTokensToBeClaimed: checks the balance of tokens that can be claimed by the user
     */
    const getTokensToBeClaimed = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = wallet.signerRef.current;
            // Create an instance of NFT Contract
            const nftContract = new Contract(
                NFT_CONTRACT_ADDRESS,
                NFTEEE_ABI,
                provider
            );
            // Create an instance of tokenContract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            );
            // We will get the signer now to extract the address of the currently connected MetaMask account
            // const signer = wallet.signerRef.current;
            // Get the address associated to the signer which is connected to  MetaMask
            // const address = wallet.walletAddress.current;
            // call the balanceOf from the NFT contract to get the number of NFT's held by the user
            const balance = await nftContract.balanceOf(wallet.walletAddress.current);
            // balance is a Big number and thus we would compare it with Big number `zero`
            if (balance === zero) {
                setTokensToBeClaimed(zero);
            } else {
                // amount keeps track of the number of unclaimed tokens
                var amount = 0;
                // For all the NFT's, check if the tokens have already been claimed
                // Only increase the amount if the tokens have not been claimed
                // for a an NFT(for a given tokenId)
                for (var i = 0; i < balance; i++) {
                    const tokenId = await nftContract.tokenOfOwnerByIndex(wallet.walletAddress.current, i);
                    const claimed = await tokenContract.tokenIdsClaimed(tokenId);
                    if (!claimed) {
                        amount++;
                    }
                }
                //tokensToBeClaimed has been initialized to a Big Number, thus we would convert amount
                // to a big number and then set its value
                setTokensToBeClaimed(BigNumber.from(amount));
            }
        } catch (err) {
            console.error(err);
            setTokensToBeClaimed(zero);
        }
    };

    /**
     * getBalanceOfCryptoDevTokens: checks the balance of Crypto Dev Tokens's held by an address
     */
    const getBalanceOfCryptoDevTokens = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = wallet.signerRef.current;
            // Create an instace of token contract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            );
            // We will get the signer now to extract the address of the currently connected MetaMask account
            // const signer = wallet.signerRef.current;
            // Get the address associated to the signer which is connected to  MetaMask
            // const address = wallet.walletAddress.current;
            // call the balanceOf from the token contract to get the number of tokens held by the user
            const balance = await tokenContract.balanceOf(wallet.walletAddress.current);
            // balance is already a big number, so we dont need to convert it before setting it
            setBalanceOfCryptoDevTokens(balance);
        } catch (err) {
            console.error(err);
            setBalanceOfCryptoDevTokens(zero);
        }
    };

    /**
     * mintCryptoDevToken: mints `amount` number of tokens to a given address
     */
    const mintCryptoDevToken = async (amount) => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            // Create an instance of tokenContract
            const signer = wallet.signerRef.current;
            // Create an instance of tokenContract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            );
            // Each token is of `0.001 ether`. The value we need to send is `0.001 * amount`
            const value = 0.001 * amount;
            const tx = await tokenContract.mint(amount, {
                // value signifies the cost of one crypto dev token which is "0.001" eth.
                // We are parsing `0.001` string to ether using the utils library from ethers.js
                value: utils.parseEther(value.toString()),
            });
            setLoading(true);
            // wait for the transaction to get mined
            await tx.wait();
            setLoading(false);
            window.alert("Sucessfully minted FRGDC Tokens");
            await getBalanceOfCryptoDevTokens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * claimCryptoDevTokens: Helps the user claim Crypto Dev Tokens
     */
    const claimCryptoDevTokens = async () => {
        try {
            // We need a Signer here since this is a 'write' transaction.
            // Create an instance of tokenContract
            const signer = wallet.signerRef.current;
            // Create an instance of tokenContract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                signer
            );
            const tx = await tokenContract.claim();
            setLoading(true);
            // wait for the transaction to get mined
            await tx.wait();
            setLoading(false);
            window.alert("Sucessfully claimed FRGDC Tokens");
            await getBalanceOfCryptoDevTokens();
            await getTotalTokensMinted();
            await getTokensToBeClaimed();
        } catch (err) {
            console.error(err);
        }
    };

    /**
     * getTotalTokensMinted: Retrieves how many tokens have been minted till now
     * out of the total supply
     */
    const getTotalTokensMinted = async () => {
        try {
            // Get the provider from web3Modal, which in our case is MetaMask
            // No need for the Signer here, as we are only reading state from the blockchain
            const provider = wallet.signerRef.current;

            // Create an instance of token contract
            const tokenContract = new Contract(
                TOKEN_CONTRACT_ADDRESS,
                TOKEN_CONTRACT_ABI,
                provider
            );

            // Get all the tokens that have been minted
            const _tokensMinted = await tokenContract.totalSupply();

            setTokensMinted(_tokensMinted);
        } catch (err) {
            console.error(err);
        }
    };



    // useEffects are used to react to changes in state of the website
    // The array at the end of function call represents what state changes will trigger this effect
    // In this case, whenever the value of `walletConnected` changes - this effect will be called
    useEffect(() => {
        // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
        if (wallet.walletConnected) {
            // Assign the Web3Modal class to the reference object by setting it's `current` value
            // The `current` value is persisted throughout as long as this page is open
            getTotalTokensMinted();
            getBalanceOfCryptoDevTokens();
            getTokensToBeClaimed();
        }
    }, [wallet.walletConnected]);

    /*
          renderButton: Returns a button based on the state of the dapp
        */
    const renderButton = () => {
        // If we are currently waiting for something, return a loading button
        if (loading) {
            return (
                <div>
                    <button className={styles.button}>Loading...</button>
                </div>
            );
        }
        // If tokens to be claimed are greater than 0, Return a claim button
        if (tokensToBeClaimed > 0) {
            return (
                <div>
                    <div className={styles.description}>
                        {tokensToBeClaimed * 3} Tokens can be claimed!
                    </div>
                    <button className={styles.button} onClick={claimCryptoDevTokens}>
                        Claim Tokens
                    </button>
                </div>
            );
        }
        // If user doesn't have any tokens to claim, show the mint button
        return (
            <div style={{ display: "flex-col" }}>
                <div>
                    <input
                        type="number"
                        placeholder="Amount of Tokens"
                        // BigNumber.from converts the `e.target.value` to a BigNumber
                        onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
                        className={styles.input}
                    />
                </div>

                <button
                    className={styles.button}
                    disabled={!(tokenAmount > 0)}
                    onClick={() => mintCryptoDevToken(tokenAmount)}
                >
                    Mint Tokens
                </button>
            </div>
        );
    };

    return (
        <div>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>Welcome to Crypto Devs ICO!</h1>
                    <div className={styles.description}>
                        You can claim or mint Crypto Dev tokens here
                    </div>
                    {wallet.walletConnected ? (
                        <div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} Crypto
                                Dev Tokens
                            </div>
                            <div className={styles.description}>
                                {/* Format Ether helps us in converting a BigNumber to string */}
                                Overall {utils.formatEther(tokensMinted)}/3003 have been minted!!!
                            </div>
                            {renderButton()}
                        </div>
                    ) : (
                        <button className={styles.button}>
                            Connect your wallet
                        </button>
                    )}
                </div>
                <div>
                    <img className={styles.image} src="./14.svg" />
                </div>
            </div>

        </div>
    );
}
