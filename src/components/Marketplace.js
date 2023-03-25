import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { useState} from 'react';
import { BiSearch, BiTransfer } from 'react-icons/bi'
import { MdOpenInNew } from 'react-icons/md'
export default function Marketplace() {
    
    const sampleData = [
        {
            "name": "NFT#1",
            "description": "Alchemy's First NFT",
            "website": "http://axieinfinity.io",
            "image": "https://gateway.pinata.cloud/ipfs/QmTsRJX7r5gyubjkdmzFrKQhHv74p5wT9LdeF1m3RTqrE5",
            "price": "0.03ETH",
            "currentlySelling": "True",
            "address": "0xe81Bf5A757CB4f7F82a2F23b1e59bE45c33c5b13",
        },
        {
            "name": "NFT#2",
            "description": "Alchemy's Second NFT",
            "website": "http://axieinfinity.io",
            "image": "https://gateway.pinata.cloud/ipfs/QmdhoL9K8my2vi3fej97foiqGmJ389SMs55oC5EdkrxF2M",
            "price": "0.03ETH",
            "currentlySelling": "True",
            "address": "0xe81Bf5A757C4f7F82a2F23b1e59bE45c33c5b13",
        },
        {
            "name": "NFT#3",
            "description": "Alchemy's Third NFT",
            "website": "http://axieinfinity.io",
            "image": "https://gateway.pinata.cloud/ipfs/QmTsRJX7r5gyubjkdmzFrKQhHv74p5wT9LdeF1m3RTqrE5",
            "price": "0.03ETH",
            "currentlySelling": "True",
            "address": "0xe81Bf5A757C4f7F82a2F23b1e59bE45c33c5b13",
        },
    ];
    const [data, updateData] = useState(sampleData);
    const [dataFetched, updateFetched] = useState(false);
    const [trans, updateTrans] = useState([]);
    const [transFetched, updateTransFetched] = useState(false);
    const [search, updateSearch] = useState([]);
    
    const [formParams, updateFormParams] = useState({ name: '' });

    async function getAllNFTs() {
        const ethers = require("ethers");
        //After adding your Hardhat network to your metamask, this code will get providers and signers
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        //Pull the deployed contract instance
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer)
        //create an NFT Token
        let transaction = await contract.getAllNFTs()

        //Fetch all the details of every NFT from the contract and display
        const items = await Promise.all(transaction.map(async i => {
            const tokenURI = await contract.tokenURI(i.tokenId);
            let meta = await axios.get(tokenURI, {
                headers: {
                    'Accept': 'text/plain'
                }
            });
            meta = meta.data;
            if (i.currentlyListed) {
                let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
                let item = {
                    price,
                    tokenId: i.tokenId.toNumber(),
                    seller: i.seller,
                    owner: i.owner,
                    image: meta.image,
                    name: meta.name,
                    description: meta.description,
                    inAuction: i.inAuction
                }
                return item;
            }
            else {
                let price = "0";
                let item = {
                    price,
                    tokenId: null,
                    seller: null,
                    owner: null,
                    image: null,
                    name: null,
                    description: null,
                }
                return item;
            }
        }))

        updateFetched(true);
        //updateData(items);
        
        //updateData([...items]);
        const newdata = () => {
            const newda = items
            updateData(newda)
        }
        newdata();
        
        console.log(items);

    }

    if (!dataFetched)
        getAllNFTs();




    async function getAllTransfers() {
        try {
            const ethers = require("ethers");
            //After adding your Hardhat network to your metamask, this code will get providers and signers
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
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
        getAllTransfers();


    async function searchNFT(name) {
        try {
            const Search_items = [];
            for (var Key in data) {
                if (name === data[Key].name) {
                    Search_items[Key] = data[Key];
                    console.log(data[Key].name);
                }

            }
            console.log(Search_items);

            
            const newtr = () => {
                const newt = Search_items
                updateSearch(newt)
            }
            newtr();
            updateFormParams({ name: ''});
        }
        catch (e) {
            console.log(e)
        }
    }



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


    const name = formParams.name;

    function getRandomizedData(data) {
        // 计算每个数据的权重值
        const weights = data.map((d) => d.clicks + d.comments);

        // 添加一个小的随机数
        const weightedRandoms = weights.map((w) => w + Math.random() * 0.2);

        // 对权重值进行归一化
        const sum = weightedRandoms.reduce((acc, val) => acc + val, 0);
        const normalizedWeights = weightedRandoms.map((w) => w / sum);

        // 对数据进行随机抽样
        const result = [];
        for (let i = 0; i < 3; i++) {
            let rand = Math.random();
            for (let j = 0; j < data.length; j++) {
                rand -= normalizedWeights[j];
                if (rand <= 0) {
                    result.push(data[j]);
                    break;
                }
            }
        }

        return result;
    }
    //const randomizedData = getRandomizedData(data);
    const randomizedData = data.sort(() => Math.random() - 0.5).slice(0, 3);

    return (
        <div>
            <Navbar></Navbar>
            <div className="flex flex-col place-items-center mt-20">

                <div>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" value={formParams.name} onChange={e => updateFormParams({ ...formParams, name: e.target.value })}></input>
                    <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={()=>searchNFT(name)}>Search</button>
                    <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                        {search.map((value, index) => {
                            return <NFTTile data={value} key={index}></NFTTile>;
                        })}
                    </div>
                </div>


                <div className="md:text-xl font-bold text-white">
                    Top NFTs
                </div>

                <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                    {data.map((value, index) => (
                        value.tokenId == null || value.inAuction == true
                            ? <div style={{ display: 'none' }}></div>
                            :  <NFTTile data={value} key={index}></NFTTile>
                       
                    ))}
                </div>

                <div className="md:text-xl font-bold text-white">
                    Auction
                </div>

                <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                    {data.map((value, index) => (
                        value.tokenId == null || value.inAuction == false
                            ? <div style={{ display: 'none' }}></div>
                            : <NFTTile data={value} key={index}></NFTTile>

                    ))}
                </div>

            </div>

            <div className="w-4/5 py-10 mx-auto">
                <h4 className="text-white text-3xl font-bold uppercase text-gradient">
                    {randomizedData.length > 0 ? 'Recommended for you' : ''}
                </h4>
                <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                    {randomizedData.map((value, index) => (
                        value.tokenId == null
                            ? <div style={{ display: 'none' }}></div>
                            : <NFTTile data={value} key={index}></NFTTile>

                    ))}
                </div>
            </div>




            <div className="w-4/5 py-10 mx-auto">
                <h4 className="text-white text-3xl font-bold uppercase text-gradient">
                    {trans.length > 0 ? 'Latest Transactions' : 'No Transaction Yet'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4 lg:gap-2 py-2.5">
                    {trans.map((tx) => (
                        <div
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
                                    <a href="#" className="text-pink-500 mr-2">
                                        {truncate(tx.owner, 4, 4, 11)}
                                    </a>
                                    <a href="#">
                                        <MdOpenInNew />
                                    </a>
                                </small>
                            </div>

                            <p className="text-sm font-medium">{tx.cost}ETH</p>
                        </div>
                    ))}
                </div>
            </div>


        </div>


    );

}