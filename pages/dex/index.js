import { BigNumber, providers, utils } from "ethers";
import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "../../styles/Home.module.css";
import { addLiquidity, calculateCD } from "../../components/dex-utils/addLiquidity";
import {
    getCDTokensBalance,
    getEtherBalance,
    getLPTokensBalance,
    getReserveOfCDTokens,
} from "../../components/dex-utils/getAmounts";
import {
    getTokensAfterRemove,
    removeLiquidity,
} from "../../components/dex-utils/removeLiquidity";
import { swapTokens, getAmountOfTokensReceivedFromSwap } from "../../components/dex-utils/swap";
import WalletContext from "../../components/WalletContext";

export default function Home() {
    /** General state variables */
    // loading is set to true when the transaction is mining and set to false when the transaction has mined
    const [loading, setLoading] = useState(false);
    // We have two tabs in this dapp, Liquidity Tab and Swap Tab. This variable keeps track of which Tab the user is on
    // If it is set to true this means that the user is on `liquidity` tab else he is on `swap` tab
    const [liquidityTab, setLiquidityTab] = useState(true);
    // This variable is the `0` number in form of a BigNumber
    const zero = BigNumber.from(0);
    /** Variables to keep track of amount */
    // `ethBalance` keeps track of the amount of Eth held by the user's account
    const [ethBalance, setEtherBalance] = useState(zero);
    // `reservedCD` keeps track of the Crypto Dev tokens Reserve balance in the Exchange contract
    const [reservedCD, setReservedCD] = useState(zero);
    // Keeps track of the ether balance in the contract
    const [etherBalanceContract, setEtherBalanceContract] = useState(zero);
    // cdBalance is the amount of `CD` tokens help by the users account
    const [cdBalance, setCDBalance] = useState(zero);
    // `lpBalance` is the amount of LP tokens held by the users account
    const [lpBalance, setLPBalance] = useState(zero);
    /** Variables to keep track of liquidity to be added or removed */
    // addEther is the amount of Ether that the user wants to add to the liquidity
    const [addEther, setAddEther] = useState(zero);
    // addCDTokens keeps track of the amount of CD tokens that the user wants to add to the liquidity
    // in case when there is no initial liquidity and after liquidity gets added it keeps track of the
    // CD tokens that the user can add given a certain amount of ether
    const [addCDTokens, setAddCDTokens] = useState(zero);
    // removeEther is the amount of `Ether` that would be sent back to the user based on a certain number of `LP` tokens
    const [removeEther, setRemoveEther] = useState(zero);
    // removeCD is the amount of `Crypto Dev` tokens that would be sent back to the user base on a certain number of `LP` tokens
    // that he wants to withdraw
    const [removeCD, setRemoveCD] = useState(zero);
    // amount of LP tokens that the user wants to remove from liquidity
    const [removeLPTokens, setRemoveLPTokens] = useState("0");
    /** Variables to keep track of swap functionality */
    // Amount that the user wants to swap
    const [swapAmount, setSwapAmount] = useState("");
    // This keeps track of the number of tokens that the user would recieve after a swap completes
    const [tokenToBeRecievedAfterSwap, setTokenToBeRecievedAfterSwap] =
        useState(zero);
    // Keeps track of whether  `Eth` or `Crypto Dev` token is selected. If `Eth` is selected it means that the user
    // wants to swap some `Eth` for some `Crypto Dev` tokens and vice versa if `Eth` is not selected
    const [ethSelected, setEthSelected] = useState(true);
    /** Wallet connection */
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
    // const web3ModalRef = useRef();
    // walletConnected keep track of whether the user's wallet is connected or not
    // const [walletConnected, setWalletConnected] = useState(false);
    // Wallet global Context
    const wallet = useContext(WalletContext);
    /**
     * getAmounts call various functions to retrive amounts for ethbalance,
     * LP tokens etc
     */
    const getAmounts = async () => {
        try {
            const provider = wallet.signerRef.current.provider;
            const signer = wallet.signerRef.current;
            const address = await signer.getAddress();
            // get the amount of eth in the user's account
            const _ethBalance = await getEtherBalance(provider, address);
            // get the amount of `Crypto Dev` tokens held by the user
            const _cdBalance = await getCDTokensBalance(provider, address);
            // get the amount of `Crypto Dev` LP tokens held by the user
            const _lpBalance = await getLPTokensBalance(provider, address);
            // gets the amount of `CD` tokens that are present in the reserve of the `Exchange contract`
            const _reservedCD = await getReserveOfCDTokens(provider);
            // Get the ether reserves in the contract
            const _ethBalanceContract = await getEtherBalance(provider, null, true);
            setEtherBalance(_ethBalance);
            setCDBalance(_cdBalance);
            setLPBalance(_lpBalance);
            setReservedCD(_reservedCD);
            setReservedCD(_reservedCD);
            setEtherBalanceContract(_ethBalanceContract);
        } catch (err) {
            console.error(err);
        }
    };

    /**** SWAP FUNCTIONS ****/

    /*
    swapTokens: Swaps  `swapAmountWei` of Eth/Crypto Dev tokens with `tokenToBeRecievedAfterSwap` amount of Eth/Crypto Dev tokens.
  */
    const _swapTokens = async () => {
        try {
            if (swapAmount) {
                // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
                const swapAmountWei = utils.parseEther(swapAmount);
                // Check if the user entered zero
                // We are here using the `eq` method from BigNumber class in `ethers.js`
                if (!swapAmountWei.eq(zero)) {
                    const signer = wallet.signerRef.current;
                    setLoading(true);
                    // Call the swapTokens function from the `utils` folder
                    await swapTokens(
                        signer,
                        swapAmountWei,
                        tokenToBeRecievedAfterSwap,
                        ethSelected
                    );
                    setLoading(false);
                    // Get all the updated amounts after the swap
                    await getAmounts();
                    setSwapAmount("");
                }
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setSwapAmount("");
        }
    };

    /*
      _getAmountOfTokensReceivedFromSwap:  Returns the number of Eth/Crypto Dev tokens that can be recieved 
      when the user swaps `_swapAmountWEI` amount of Eth/Crypto Dev tokens.
   */
    const _getAmountOfTokensReceivedFromSwap = async (_swapAmount) => {
        try {
            // Convert the amount entered by the user to a BigNumber using the `parseEther` library from `ethers.js`
            const _swapAmountWEI = utils.parseEther(_swapAmount.toString());
            // Check if the user entered zero
            // We are here using the `eq` method from BigNumber class in `ethers.js`
            if (!_swapAmountWEI.eq(zero)) {
                const provider = wallet.signerRef.current.provider;
                // Get the amount of ether in the contract
                const _ethBalance = await getEtherBalance(provider, null, true);
                // Call the `getAmountOfTokensReceivedFromSwap` from the utils folder
                const amountOfTokens = await getAmountOfTokensReceivedFromSwap(
                    _swapAmountWEI,
                    provider,
                    ethSelected,
                    _ethBalance,
                    reservedCD
                );
                setTokenToBeRecievedAfterSwap(amountOfTokens);
            } else {
                setTokenToBeRecievedAfterSwap(zero);
            }
        } catch (err) {
            console.error(err);
        }
    };

    /*** END ***/

    /**** ADD LIQUIDITY FUNCTIONS ****/

    /**
     * _addLiquidity helps add liquidity to the exchange,
     * If the user is adding initial liquidity, user decides the ether and CD tokens he wants to add
     * to the exchange. If we he adding the liquidity after the initial liquidity has already been added
     * then we calculate the crypto dev tokens he can add, given the eth he wants to add by keeping the ratios
     * constant
     */
    const _addLiquidity = async () => {
        try {
            // Convert the ether amount entered by the user to Bignumber
            const addEtherWei = utils.parseEther(addEther.toString());
            // Check if the values are zero
            if (!addCDTokens.eq(zero) && !addEtherWei.eq(zero)) {
                const signer = wallet.signerRef.current;
                setLoading(true);
                // call the addLiquidity function from the utils folder
                await addLiquidity(signer, addCDTokens, addEtherWei);
                setLoading(false);
                // Reinitialize the CD tokens
                setAddCDTokens(zero);
                // Get amounts for all values after the liquidity has been added
                await getAmounts();
            } else {
                setAddCDTokens(zero);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setAddCDTokens(zero);
        }
    };

    /**** END ****/

    /**** REMOVE LIQUIDITY FUNCTIONS ****/

    /**
     * _removeLiquidity: Removes the `removeLPTokensWei` amount of LP tokens from
     * liquidity and also the calculated amount of `ether` and `CD` tokens
     */
    const _removeLiquidity = async () => {
        try {
            const signer = wallet.signerRef.current;
            // Convert the LP tokens entered by the user to a BigNumber
            const removeLPTokensWei = utils.parseEther(removeLPTokens);
            setLoading(true);
            // Call the removeLiquidity function from the `utils` folder
            await removeLiquidity(signer, removeLPTokensWei);
            setLoading(false);
            await getAmounts();
            setRemoveCD(zero);
            setRemoveEther(zero);
        } catch (err) {
            console.error(err);
            setLoading(false);
            setRemoveCD(zero);
            setRemoveEther(zero);
        }
    };

    /**
     * _getTokensAfterRemove: Calculates the amount of `Ether` and `CD` tokens
     * that would be returned back to user after he removes `removeLPTokenWei` amount
     * of LP tokens from the contract
     */
    const _getTokensAfterRemove = async (_removeLPTokens) => {
        try {
            const provider = wallet.signerRef.current.provider;
            // Convert the LP tokens entered by the user to a BigNumber
            const removeLPTokenWei = utils.parseEther(_removeLPTokens);
            // Get the Eth reserves within the exchange contract
            const _ethBalance = await getEtherBalance(provider, null, true);
            // get the crypto dev token reserves from the contract
            const cryptoDevTokenReserve = await getReserveOfCDTokens(provider);
            // call the getTokensAfterRemove from the utils folder
            const { _removeEther, _removeCD } = await getTokensAfterRemove(
                provider,
                removeLPTokenWei,
                _ethBalance,
                cryptoDevTokenReserve
            );
            setRemoveEther(_removeEther);
            setRemoveCD(_removeCD);
        } catch (err) {
            console.error(err);
        }
    };

    /**** END ****/

    // useEffects are used to react to changes in state of the website
    // The array at the end of function call represents what state changes will trigger this effect
    // In this case, whenever the value of `walletConnected` changes - this effect will be called
    useEffect(() => {
        if (wallet.walletConnected) {
            getAmounts();
        }
    }, [wallet.walletConnected]);

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

        if (liquidityTab) {
            return (
                <div>
                    <div className={styles.description}>
                        <span className="font-bold">You have:</span>
                        <br />
                        {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                        * {utils.formatEther(cdBalance)} FRGDC Tokens
                        <br />
                        * {utils.formatEther(ethBalance)} Ether
                        <br />
                        * {utils.formatEther(lpBalance)} FRGDC LP tokens
                    </div>
                    <div>
                        {/* If reserved CD is zero, render the state for liquidity zero where we ask the user
            who much initial liquidity he wants to add else just render the state where liquidity is not zero and
            we calculate based on the `Eth` amount specified by the user how much `CD` tokens can be added */}
                        {utils.parseEther(reservedCD.toString()).eq(zero) ? (
                            <div>
                                <input
                                    type="number"
                                    placeholder="Amount of Ether"
                                    onChange={(e) => setAddEther(e.target.value || "0")}
                                    className={styles.input}
                                />
                                <input
                                    type="number"
                                    placeholder="Amount of CryptoDev tokens"
                                    onChange={(e) =>
                                        setAddCDTokens(
                                            BigNumber.from(utils.parseEther(e.target.value || "0"))
                                        )
                                    }
                                    className={styles.input}
                                />
                                <button className={styles.button1} onClick={_addLiquidity}>
                                    Add
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p className="text-2xl font-bold">Add Liquidity</p>
                                <input
                                    type="number"
                                    placeholder="Amount of Ether"
                                    onChange={async (e) => {
                                        setAddEther(e.target.value || "0");
                                        // calculate the number of CD tokens that
                                        // can be added given  `e.target.value` amount of Eth
                                        const _addCDTokens = await calculateCD(
                                            e.target.value || "0",
                                            etherBalanceContract,
                                            reservedCD
                                        );
                                        setAddCDTokens(_addCDTokens);
                                    }}
                                    className={styles.input}
                                />
                                <div className={styles.inputDiv}>
                                    {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                                    {`You will need ${utils.formatEther(addCDTokens)} FRGDC Tokens`}
                                </div>
                                <button className="text-xl bg-green-600 py-1 px-3 rounded-xl" onClick={_addLiquidity}>
                                    Add
                                </button>
                            </div>
                        )}
                        <br />
                        <div>
                            <p className="text-2xl font-bold">Remove Liquidity</p>
                            <input
                                type="number"
                                placeholder="Amount of LP Tokens"
                                onChange={async (e) => {
                                    setRemoveLPTokens(e.target.value || "0");
                                    // Calculate the amount of Ether and CD tokens that the user would recieve
                                    // After he removes `e.target.value` amount of `LP` tokens
                                    await _getTokensAfterRemove(e.target.value || "0");
                                }}
                                className={styles.input}
                            />
                            <div className={styles.inputDiv}>
                                {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                                {`You will get ${utils.formatEther(removeCD)} FRGDC Tokens and ${utils.formatEther(removeEther)} Eth`}
                            </div>
                            <button className="text-xl bg-green-600 py-1 px-3 rounded-xl" onClick={_removeLiquidity}>
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="mt-4">
                    <p className="text-2xl font-bold">Swap</p>
                    <input
                        type="number"
                        placeholder="Amount"
                        onChange={async (e) => {
                            setSwapAmount(e.target.value || "");
                            // Calculate the amount of tokens user would recieve after the swap
                            await _getAmountOfTokensReceivedFromSwap(e.target.value || "0");
                        }}
                        className={styles.input}
                        value={swapAmount}
                    />
                    <select
                        className={styles.select}
                        name="dropdown"
                        id="dropdown"
                        onChange={async () => {
                            setEthSelected(!ethSelected);
                            // Initialize the values back to zero
                            await _getAmountOfTokensReceivedFromSwap(0);
                            setSwapAmount("");
                        }}
                    >
                        <option value="eth">Ethereum</option>
                        <option value="FRGDCToken">FRGDC Token</option>
                    </select>
                    <br />
                    <div className={styles.inputDiv}>
                        {/* Convert the BigNumber to string using the formatEther function from ethers.js */}
                        {ethSelected
                            ? `You will get ${utils.formatEther(
                                tokenToBeRecievedAfterSwap
                            )} FRGDC Tokens`
                            : `You will get ${utils.formatEther(
                                tokenToBeRecievedAfterSwap
                            )} Eth`}
                    </div>
                    <button className="text-xl bg-green-600 py-1 px-3 rounded-xl" onClick={_swapTokens}>
                        Swap
                    </button>
                </div>
            );
        }
    };

    return (
        <div>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>FRDGC DEX! Swap it</h1>
                    <div className={styles.description}>
                        Exchange Ethereum &#60;&#62; FRDGC Tokens
                    </div>
                    <div>
                        <button
                            className={styles.button}
                            onClick={() => {
                                setLiquidityTab(true);
                            }}
                        >
                            Liquidity
                        </button>
                        <button
                            className={styles.button}
                            onClick={() => {
                                setLiquidityTab(false);
                            }}
                        >
                            Swap
                        </button>
                    </div>
                    {renderButton()}
                </div>
                <div>
                    <img className={styles.image} src="./14.svg" />
                </div>
            </div>
        </div>
    );
}
