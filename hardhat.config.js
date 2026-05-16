require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const AMOY_RPC_URL = process.env.AMOY_RPC_URL || "";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const accounts = DEPLOYER_KEY ? [DEPLOYER_KEY] : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    ...(SEPOLIA_RPC_URL && accounts.length
      ? {
          sepolia: {
            url: SEPOLIA_RPC_URL,
            chainId: 11155111,
            accounts,
          },
        }
      : {}),
    ...(AMOY_RPC_URL && accounts.length
      ? {
          amoy: {
            url: AMOY_RPC_URL,
            chainId: 80002,
            accounts,
          },
        }
      : {}),
  },
  paths: {
    artifacts: "./client/src/artifacts",
  },
};
