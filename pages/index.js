import React, { useContext, useEffect, useRef, useState } from "react";
import styles from "../styles/Home.module.css";
import WalletContext from "../components/WalletContext";

export default function Home({ connectWallet }) {
    const wallet = useContext(WalletContext);

    useEffect(() => {
        if (wallet.walletAddress.current !== undefined) {
            let wAddress = document.getElementById("wAddress");
            wAddress.textContent = wallet.walletAddress.current.substring(0, 8) + " ";
        }
    }, [wallet.walletConnected]);

    return (
        <div className="min-h-[80vh] flex flex-row justify-center items-center" >
            <div className="">
                <h1 className="text-sm font-bold md:text-2xl lg:text-4xl mx-3" >
                    Welcome&nbsp;
                    <span id="wAddress" className="text-cyan-500"></span>
                    to the firigid 🧊 Clowder <img className="h-12 inline-block" src="./siamese.png"></img>!
                </h1>
                <div className="text-sm md:text-xl lg:text-2xl leading-5 mx-3 mt-6" >
                    NOT COOl! It is an ICY 🧊 Clowder of developers in Crypto.
                </div>
            </div>
            <div>
                <img className={styles.image}
                    src="./14.svg" />
            </div>
        </div >
    );
}