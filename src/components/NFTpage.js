import Navbar from "./Navbar";
//import axie from "../tile.jpeg";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import React, { useState, useEffect } from 'react';
import ChatWindow from './ChatWindow';
import ChatList from './ChatList';



export default function NFTPage (props) {

const [data, updateData] = useState({});
const [dataFetched, updateDataFetched] = useState(false);
const [message, updateMessage] = useState("");
const [currAddress, updateCurrAddress] = useState("0x");
const [formParams, updateFormParams] = useState({ price: '' });
const [arr, setArr] = useState([]);
const [comment, setComment] = useState("");
const [comments, setComments] = useState(
    JSON.parse(localStorage.getItem("comments")) || []
);



async function getNFTData(tokenId) {
    const ethers = require("ethers");
    //After adding your Hardhat network to your metamask, this code will get providers and signers
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const addr = await signer.getAddress();
    //Pull the deployed contract instance
    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)

    //create an NFT Token
    let transaction = await contract.getAllNFTs()
    //Fetch all the details of every NFT from the contract and display
    const new_items = await Promise.all(transaction.map(async i => {
        let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
        return price;
    }))
    const newpr = () => {
        const newpri = new_items;
        setArr(newpri)
    }
    newpr();
    //create an NFT Token
    const tokenURI = await contract.tokenURI(tokenId);
    const listedToken = await contract.getListedTokenForId(tokenId);

    let meta = await axios.get(tokenURI, {
        headers: {
            'Accept': 'text/plain'
        }
    });
    meta = meta.data;
    console.log(listedToken);

    let item = {
        price: meta.price,
        tokenId: tokenId,
        seller: listedToken.seller,
        owner: listedToken.owner,
        image: meta.image,
        name: meta.name,
        description: meta.description,
        inAuction: listedToken.inAuction,
        day: meta.day
    }
    console.log(item);
    updateData(item);

    updateDataFetched(true);

    console.log("address", addr)
    updateCurrAddress(addr);

    newaddr();

}

async function buyNFT(tokenId) {
    try {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
        const salePrice = ethers.utils.parseUnits(arr[tokenId - 1], 'ether')
        updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
        //run the executeSale function
        let transaction = await contract.executeSale(tokenId, {value:salePrice});
        const tr = await transaction.wait();
        console.log(tr)
        alert('You successfully bought the NFT!');
        updateMessage("");
    }
    catch(e) {
        alert("Upload Error"+e)
    }
}

    async function updataNFTprice(tokenId,newPrice) {
       

        try {
            //let newprice = formParams.price;
            if (!newPrice )
                return;
            const ethers = require("ethers");
            
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            //Pull the deployed contract instance
            const contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            updateMessage("changing price... Please Wait (Upto 5 mins)")
            const tx = await contract.updateTokenPrice(tokenId, newPrice);
            const receipt = await tx.wait();
            //resell nft
            const re = await contract.resell(tokenId, newPrice);
            const rec = await re.wait();
            console.log(receipt);
            console.log(rec+"yes or not");

            alert('You successfully change price!');

            //run the changeprice function
            updateMessage("");
        }
        catch (e) {
            console.error("Error updating  price:", e);
        }
  }

    const params = useParams();
    const tokenId = params.tokenId;
    const newprice = formParams.price;
    const ethers = require("ethers");




    if(!dataFetched)
        getNFTData(tokenId);



  
    return(
        <div style={{"min-height":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{arr[tokenId-1] + " ETH"}</span>
                    </div>

                    <div>
                        
                    </div>

                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>


                    <div>
                        {currAddress == data.owner || currAddress == data.seller
                            ? <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="price">change Price (in ETH)</label>
                            : <div></div>
                        }
                        <div className="text-green text-center mt-3">{}</div>
                    </div>

                    <div>
                        {currAddress == data.owner || currAddress == data.seller
                            ? <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" placeholder="Min 0.01 ETH" step="0.01" value={formParams.price} onChange={e => updateFormParams({ ...formParams, price: e.target.value })}></input>
                            : <div></div>
                        }
                        <div className="text-green text-center mt-3">{}</div>
                    </div>
                    
                    <div>
                        {currAddress == data.owner || currAddress == data.seller
                        ? <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => updataNFTprice(tokenId, ethers.utils.parseEther(newprice))}>Change price</button>
                        : <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(tokenId)}>Buy this NFT</button>
                        }
                    <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>

        
        
        </div>

    )
}