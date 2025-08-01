import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 100,
      },
    },
  },
  networks: {
    // ============ MAINNET FORKS FOR OPTIONS TESTING ============
    
    // Ethereum Fork - Best for most testing (has most oracles)
    hardhat: {
      forking: {
        url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
        blockNumber: 23041436, // Pin to recent block for consistency
        enabled: true,
      },
      chainId: 1337, // Hardhat default
      accounts: {
        count: 20, // More test accounts
        accountsBalance: "10000000000000000000000", // 10K ETH each
      },
      mining: {
        auto: true,
        interval: 0, // Mine immediately
      },
      // Increase timeout for large contracts
      timeout: 100000,
    },

    // Polygon Fork - For AAPL, MSFT, GOOGL stock feeds
    polygonFork: {
      url: "http://127.0.0.1:8545", // Will be overridden by forking
      forking: {
        url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
        blockNumber: 52000000,
        enabled: true,
      },
      chainId: 1338,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "10000000000000000000000",
      },
    },

    // BSC Fork - For TSLA stock feed
    bscFork: {
      url: "http://127.0.0.1:8545", // Will be overridden by forking
      forking: {
        url: "https://bsc-dataseed1.binance.org/",
        blockNumber: 35000000,
        enabled: true,
      },
      chainId: 1339,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "10000000000000000000000",
      },
    },

    // Arbitrum Fork - For additional testing
    arbitrumFork: {
      url: "http://127.0.0.1:8545", // Will be overridden by forking
      forking: {
        url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
        blockNumber: 175000000,
        enabled: true,
      },
      chainId: 1340,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 10,
        accountsBalance: "10000000000000000000000",
      },
    },

    // ============ LOCALHOST FOR CONNECTING TO RUNNING FORKS ============
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337, // Will match whatever fork is running
    },

    // ============ LIVE TESTNETS (backup) ============
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80001,
    },

    // ============ MAINNETS (for final deployment) ============
    ethereum: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
    },

    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
    },

    bsc: {
      url: "https://bsc-dataseed1.binance.org/",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 56,
    },

    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 42161,
    },
  },

  // ============ CONTRACT VERIFICATION ============
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      arbitrumOne: process.env.ARBISCAN_API_KEY,
    },
    customChains: [
      {
        network: "arbitrumOne",
        chainId: 42161,
        urls: {
          apiURL: "https://api.arbiscan.io/api",
          browserURL: "https://arbiscan.io/",
        },
      },
    ],
  },

  // ============ GAS REPORTER ============
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 20, // gwei
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },

  // ============ MOCHA TEST CONFIG ============
  mocha: {
    timeout: 100000, // 100 seconds for complex fork tests
  },

  // ============ TYPE CHAIN ============
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["externalArtifacts/*.json"],
  },

  // ============ PATHS ============
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;