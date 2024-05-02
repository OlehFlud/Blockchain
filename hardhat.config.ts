import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers/signers";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
const DEFAULT_MNEMONIC = "test test test test test test test test test test test junk";
const MNEMONIC = process.env.MNEMONIC || DEFAULT_MNEMONIC;
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: COINMARKETCAP_API_KEY,
    enabled: false,
    token: "ETH",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: DEFAULT_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      },
    },
    localhost: {
      url: "http://localhost:8545/",
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: {
        mnemonic: MNEMONIC,
      }
    }
  }
};

export default config;
