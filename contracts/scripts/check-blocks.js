const { ethers } = require("hardhat");

async function main() {
  // Get current block numbers
  console.log(process.env.INFURA_KEY)
  const networks = {
    ethereum: "https://mainnet.infura.io/v3/" + process.env.INFURA_KEY,
    polygon: "https://polygon-mainnet.infura.io/v3/" + process.env.INFURA_KEY,
    arbitrum: "https://arbitrum-mainnet.infura.io/v3/" + process.env.INFURA_KEY,
  };

  for (const [name, url] of Object.entries(networks)) {
    try {
      const provider = new ethers.JsonRpcProvider(url);
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      const date = new Date(block.timestamp * 1000);
      
      console.log(`${name.toUpperCase()}:`);
      console.log(`  Current Block: ${blockNumber}`);
      console.log(`  Block Time: ${date.toISOString()}`);
      console.log(`  Recommended Fork: ${blockNumber - 1000}`); // 1000 blocks back for safety
      console.log("");
    } catch (error) {
      console.log(`${name}: Error - ${error.message}`);
    }
  }
}

main().catch(console.error);
