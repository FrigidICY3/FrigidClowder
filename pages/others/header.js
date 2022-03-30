import Head from "next/head";
import { Navbar } from "../../components/Navbar";

export default function Header(props) {
    return (
        <>
            <Head>
                <title>Firigid🧊Clowder</title>
                <meta name="description" content="firigid NFT collection for 303 clowder daoing around Web3" />
                <link rel="icon" href="/favicon.png" />
            </Head>
            <Navbar />
        </>
    )
}