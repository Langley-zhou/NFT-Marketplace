

根据 [alchemy.com](https://alchemy.com) 所出的教程 [Build your own NFT Marketplace from Scratch](https://docs.alchemy.com/alchemy/)  ，添加了些内容。

添加.env文件
```bash
REACT_APP_ALCHEMY_API_URL=""
REACT_APP_PRIVATE_KEY=""
REACT_APP_PINATA_KEY=""
REACT_APP_PINATA_SECRET=""
```
运行命令
```bash
npm install
npx hardhat run --network goerli scripts/deploy.js
npm start
```
