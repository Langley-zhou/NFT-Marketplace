require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
const fs = require('fs');
// const infuraId = fs.readFileSync(".infuraid").toString().trim() || "";
require('dotenv').config();

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


//选取ganache下的4个账户的私钥
const PRIVATE_KEY1 = "";
const PRIVATE_KEY2 = "";
const PRIVATE_KEY3 = "";
const PRIVATE_KEY4 = "";


module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/nAhiCHKvZkhkp4A7PkkCIBON0-BXW26d`,
      //accounts: [process.env.privateKey]
    },
    matic: {
      url: "https://polygon-mainnet.g.alchemy.com/v2/nAhiCHKvZkhkp4A7PkkCIBON0-BXW26d",
      //accounts: [process.env.privateKey]
    },
    goerli: {
      url: process.env.REACT_APP_ALCHEMY_API_URL,
      accounts: [ process.env.REACT_APP_PRIVATE_KEY ]
    },
    sepolia: {
       url: process.env.REACT_APP_ALCHEMY_API_URL,
       accounts: [process.env.REACT_APP_PRIVATE_KEY]
      },
      ganache: {
          url: `http://127.0.0.1:8545`,
          accounts: [`0x${PRIVATE_KEY1}`, `0x${PRIVATE_KEY2}`, `0x${PRIVATE_KEY3}`, `0x${PRIVATE_KEY4}`]
      }
     
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};