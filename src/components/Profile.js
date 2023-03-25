import Navbar from "./Navbar";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState } from "react";
import NFTTile from "./NFTTile";
import { BiTransfer } from 'react-icons/bi'
import { MdOpenInNew } from 'react-icons/md'

export default function Profile () {
    const [data, updateData] = useState([]);
    const [dataFetched, updateFetched] = useState(false);
    const [address, updateAddress] = useState("0x");
    const [totalPrice, updateTotalPrice] = useState("0");
    const [trans, updateTrans] = useState([]);
    const [transFetched, updateTransFetched] = useState(false);

    async function getNFTData(tokenId) {
        const ethers = require("ethers");
        let sumPrice = 0;
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();

        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

        //create an NFT Token
        let transaction = await contract.getMyNFTs()

        /*
        * Below function takes the metadata from tokenURI and the data returned by getMyNFTs() contract function
        * and creates an object of information that is to be displayed
        */
        
        const items = await Promise.all(transaction.map(async i => {
            const tokenURI = await contract.tokenURI(i.tokenId);
            let meta = await axios.get(tokenURI);
            meta = meta.data;
            let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
            
            let item = {
                price,
                tokenId: i.tokenId.toNumber(),
                seller: i.seller,
                owner: i.owner,
                image: meta.image,
                name: meta.name,
                description: meta.description,
            }
            sumPrice += Number(price);
            return item;
        }))

        //updateData(items);
        const newdata = () => {
            const newda = items;
            updateData(newda)
        }
        newdata();

        updateFetched(true);
        //updateAddress(addr);
        const newaddr = () => {
            const newad = addr;
            updateAddress(newad)
        }
        newaddr();
        updateTotalPrice(sumPrice.toPrecision(3));
    }

    const params = useParams();
    const tokenId = params.tokenId;


    if(!dataFetched)
        getNFTData(tokenId);



    async function getMYTransfers() {
        try {
            const ethers = require("ethers");
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const addr = await signer.getAddress();
            //Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
            //create an NFT Token
            let Transfers = await contract.getAllTransactions()

            //Fetch all the details of every Transfers from the contract and display
            const Transfers_items = await Promise.all(Transfers.map(async i => {
                const tokenURI = await contract.tokenURI(i.id);
                let meta = await axios.get(tokenURI);
                meta = meta.data;
                console.log(tokenURI);
                if (addr == i.owner) {
                    let cost = ethers.utils.formatUnits(i.cost.toString(), 'ether');
                    let item = {
                        tokenId: i.id.toNumber(),
                        owner: i.owner,
                        cost: cost,
                        image: meta.image,
                        name: meta.name,
                        description: meta.description,
                    }
                    return item;
                }
                else {
                    let cost = "0";
                    let item = {
                        tokenId: null,
                        owner: null,
                        cost: null,
                        image: null,
                        name: null,
                        description: null,
                    }
                    return item;
                }
                
            }))

            updateTransFetched(true);
            const newtr = () => {
                const newt = Transfers_items
                updateTrans(newt)
            }
            newtr();
            console.log(Transfers_items);
        }
        catch (e) {
            console.log(e)
        }
    }
    if (!transFetched)
        getMYTransfers();

    const truncate = (text, startChars, endChars, maxLength) => {
        if (text.length > maxLength) {
            var start = text.substring(0, startChars)
            var end = text.substring(text.length - endChars, text.length)
            while (start.length + end.length < maxLength) {
                start = start + '.'
            }
            return start + end
        }
        return text
    }
    return (
        <div className="profileClass" style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="profileClass">
            <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
                <div className="mb-5">
                    <h2 className="font-bold">Wallet Address</h2>  
                    {address}
                </div>
               
            </div>
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        <h2 className="font-bold">No. of NFTs</h2>
                        {data.length}
                    </div>
                    <div className="ml-20">
                        <h2 className="font-bold">Total Value</h2>
                        {totalPrice} ETH
                    </div>

            </div>
            <div className="flex flex-col text-center items-center mt-11 text-white">
                <h2 className="font-bold">Your NFTs</h2>
                <div className="flex justify-center flex-wrap max-w-screen-xl">
                    {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
                <div className="mt-10 text-xl">
                    {data.length == 0 ? "Oops, No NFT data to display (Are you logged in?)":""}
                </div>
                </div>

            </div>

            
            <div className="w-4/5 py-10 mx-auto">

                <h4 className="text-white text-3xl font-bold uppercase text-gradient">
                    {trans.length > 0  ? 'Latest Transactions' : 'No Transaction Yet'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4 lg:gap-2 py-2.5">
                    {trans.map((tx) => (
                        tx.tokenId == null
                            ? <div style={{display: 'none'}}></div>
                        : <div
                            key={tx.id}
                            className="flex justify-between items-center border border-pink-500 text-gray-400 w-full shadow-xl shadow-black rounded-md overflow-hidden bg-gray-800 my-2 p-3"
                        >
                                <div className="rounded-md shadow-sm shadow-pink-500 p-2">
                                    <BiTransfer />

                                 </div>

                                <div>
                                    <h4 className="text-sm">{tx.name} Transfered</h4>
                                <small className="flex flex-row justify-start items-center">                                
                                     <span className="mr-1">Received by</span>
                                     <a href="#" className="text-pink-500 mr-2"> {truncate(tx.owner, 4, 4, 11)} </a>
                                     <a href="#"> <MdOpenInNew /> </a>                         
                                </small>
                            </div>
                            <p className="text-sm font-medium">{tx.cost}ETH</p>     
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
};