import styles from "../../styles/Home.module.css";
import { useContext } from "react";
import WalletConext from "../../components/WalletContext";

export default function ENS() {
    // Wallet context
    const wallet = useContext(WalletConext);

    /*
      renderButton: Returns a button based on the state of the dapp
    */
    const renderButton = () => {
        console.log("ONE");
        if (wallet.walletConnected) {
            return (
                <div className="text-xl font-bold bg-blue-600 w-56 text-center rounded">Wallet connected</div>
            )
        } else {
            return (
                <button className={styles.button}>
                    Connect your wallet
                </button>
            );
        }
    };

    return (
        <div className={styles.main}>
            <div>
                <h1 className={styles.title}>
                    Welcome to FRDGC {wallet.ens ? wallet.ens : wallet.walletAddress.current ? wallet.walletAddress.current.substring(0, 8) : ""}!
                </h1>
                <div className={styles.description}>
                    Its an NFT collection for the Frigid Clowder.
                </div>
                {renderButton()}
            </div>
            <div>
                <img className={styles.image} src="./14.svg" />
            </div>
        </div>
    );
}
