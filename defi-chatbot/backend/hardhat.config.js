// Add this line to include the CORRECT Hardhat Chainlink plugin
require("./tasks/simulateLocal.js");
require("@chainlink/hardhat-chainlink");
require("dotenv").config(); // Load environment variables

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

// No need to redeclare task("check-rpc") if it's already there or not needed.
// If you want to keep it:
// task("check-rpc", "Checks RPC connectivity")
//   .setAction(async (_, { ethers }) => {
//     try {
//       const provider = new ethers.providers.JsonRpcProvider(RPC_URL); // Use RPC_URL directly
//       const blockNumber = await provider.getBlockNumber();
//       console.log(`Successfully connected to RPC. Current block number: ${blockNumber}`);
//     } catch (error) {
//       console.error("Failed to connect to RPC:", error.message);
//     }
//   });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19", // Must match your contract's pragma version
  networks: {
    sepolia: {
      url: RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111, // Sepolia Chain ID
      gasLimit: 5000000,
    },
    // You can add other networks here (e.g., mainnet, localhost)
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY, // Used for verifying contracts on Etherscan
  },
};
