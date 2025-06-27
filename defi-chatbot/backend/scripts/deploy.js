// scripts/deploy.js

const { ethers } = require("hardhat");
require("dotenv").config(); // Load environment variables

async function main() {
    // These should match the Chainlink Functions configuration for Sepolia
    const routerAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"; // Sepolia Functions Router Address
    const donIdBytes = ethers.utils.formatBytes32String("fun-ethereum-sepolia-1"); // Sepolia DON ID as bytes32
    const subscriptionId = process.env.FUNCTIONS_SUBSCRIPTION_ID; // Your Chainlink Functions Subscription ID from .env

    // Input validation
    if (!subscriptionId) {
        throw new Error("FUNCTIONS_SUBSCRIPTION_ID not found in .env. Please set it.");
    }
    if (isNaN(Number(subscriptionId))) {
        throw new Error("FUNCTIONS_SUBSCRIPTION_ID in .env must be a number.");
    }

    console.log("Deploying DeFiAIChatbot contract...");

    // Get the ContractFactory for your DeFiAIChatbot
    const DeFiAIChatbot = await ethers.getContractFactory("DeFiAIChatbot");

    // Deploy the contract, passing all 3 required constructor arguments
    const consumer = await DeFiAIChatbot.deploy(
        routerAddress,
        donIdBytes,
        Number(subscriptionId) // Convert to number, as Solidity expects uint64
    );

    // Wait for the deployment transaction to be mined
    await consumer.deployed();

    console.log(`DeFiAIChatbot deployed to: ${consumer.address}`);

    // Important: Update your .env file with this new address
    console.log("\n--- IMPORTANT ---");
    console.log("Please update your .env file with the new contract address:");
    console.log(`FUNCTIONS_CONSUMER_CONTRACT_ADDRESS="${consumer.address}"`);
    console.log("-----------------\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
