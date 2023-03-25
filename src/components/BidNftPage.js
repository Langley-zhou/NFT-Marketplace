import Navbar from "./Navbar";
import { useLocation, useParams } from 'react-router-dom';
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import React, { useState, useEffect } from 'react';
import Moment from 'react-moment';


export default function BidNftPage(props) {

    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");
    const [formParams, updateFormParams] = useState({ price: '' });
    const [arr, setArr] = useState([]);

    const [auction, setAuction] = useState({});
    const [bids, setBids] = useState([]);

    const [comment, setComment] = useState("");
    const [comments, setComments] = useState(
        JSON.parse(localStorage.getItem("comments")) || []
    );

    async function getBidNFTData(tokenId) {
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
 
        const newaddr = () => {
            const newad = addr;
            updateCurrAddress(newad)
        }
        newaddr();

        // Call the `tokenIdToBids` mapping to get an array of `Bid` structs for a given `tokenId`
        const bidData = await contract.getBids(tokenId);
        setBids(bidData);
        const auctionData = await contract.getAuction(tokenId);
        setAuction(auctionData);


    }

    async function bidNFT(tokenId) {
        try {
            const ethers = require("ethers");
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            //Pull the deployed contract instance
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const bidPrice = ethers.utils.parseUnits(formParams.price, 'ether')
            updateMessage("Biding the NFT... Please Wait (Upto 5 mins)")
            //run the executeSale function
            let placeBid = await contract.placeBid(tokenId, { value: bidPrice });
            const pb = await placeBid.wait();
            console.log(pb)
            alert('You have successfully participated in the bidding!');
            updateMessage("");

            let endBid = await contract.endAuction(tokenId);
            const eb = await endBid.wait();
            console.log(eb)
        }
        catch (e) {
            alert("Upload Error" + e)
        }
    }
    // 定义函数，调用checkAuctionEnd函数
      async function callCheckAuctionEnd(tokenId) {
          const ethers = require("ethers");
          //After adding your Hardhat network to your metamask, this code will get providers and signers
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          //Pull the deployed contract instance
          let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
          const bidData = await contract.getBids(tokenId);
          const isActive = bidData.inAuction;
          if (isActive) {
              await contract.endAuction(tokenId); // 调用您的endAuction函数
          }
    }

    // 调用checkAuctionEnd函数的间隔时间（以毫秒为单位）
    const intervalTime = 10000;

    // 在间隔时间内周期性地调用callCheckAuctionEnd函数
    setInterval(() => {
        const tokenId = 123; // 替换为您要检查的tokenId
        callCheckAuctionEnd(tokenId);
    }, intervalTime);



      
    const params = useParams();
    const tokenId = params.tokenId;


    if (!dataFetched)
        getBidNFTData(tokenId);

 

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        const newComment = { author: currAddress, text: comment, tokenId: tokenId };
        setComments([...comments, newComment]);
        setComment("");
        //data.data.comments++;
        localStorage.setItem(
            "comments",
            JSON.stringify([...comments, newComment])
        );
    };

    return (
        <div style={{ "min-height": "100vh" }}>
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
                        highestBid: <span className="">{(auction.highestBid == 0 ? auction.startPrice / 1e18 : auction.highestBid / 1e18) + " ETH"}</span>
                    </div>

                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>

                    <div>
                        End Time: <Moment
                            className="text-xs font-bold"
                            unix={true}
                            date={auction.endTime}
                            format="YYYY/MM/D hh:mm A"
                        />
                    </div>


                    <div>
                        {currAddress == data.owner || currAddress == data.seller
                            ? <div ></div>
                            : <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" step="0.01" value={formParams.price} onChange={e => updateFormParams({ ...formParams, price: e.target.value })}></input>
                        }
                        <div className="text-green text-center mt-3">{ }</div>
                    </div>

                    <div>
                        {currAddress == data.owner || currAddress == data.seller
                            ? <div ></div>
                            : <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => bidNFT(tokenId)}>bid this NFT</button>
                        }
                        <div className="text-green text-center mt-3">{message}</div>
                    </div>







                </div>
            </div>

            <form onSubmit={handleCommentSubmit}>
                <div className="mb-4">
                    <label
                        htmlFor="comment"
                        className="block text-gray-700 font-bold mb-2"
                    >
                        Add a comment:
                    </label>
                    <textarea
                        id="comment"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Enter your comment here"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Add Comment
                    </button>
                </div>
            </form>
            {comments.map((comment, index) => (
                comment.tokenId == tokenId
                    ? <div key={index} className="bg-gray-100 p-3 mt-3 rounded-lg">
                        <div className="font-bold">{comment.author}</div>
                        <div>{comment.text}</div>
                    </div>

                    : <div>

                    </div>
            ))}


        </div>

    )
}