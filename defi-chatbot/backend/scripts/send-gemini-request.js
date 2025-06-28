// scripts/send-gemini-request.js

const { ethers } = require("hardhat"); // Using hardhat for provider and signer
require("dotenv").config(); // Load environment variables
const requestConfig = require("./final-request.js"); // Import your request configuration

async function main() {
    console.log("Starting Chainlink Functions Request process...");

    // --- 1. Configuration from .env and requestConfig ---
    const privateKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL;
    const consumerContractAddress = requestConfig.consumerContractAddress; // Get from requestConfig, which gets it from .env

    if (!privateKey) throw new Error("PRIVATE_KEY not found in .env");
    if (!rpcUrl) throw new Error("RPC_URL not found in .env");
    if (!consumerContractAddress) {
        throw new Error("FUNCTIONS_CONSUMER_CONTRACT_ADDRESS not found in .env. " +
                            "Please deploy your DeFiAIChatbot contract and add its address to .env.");
    }

    if (!requestConfig.secrets || requestConfig.secrets.version === undefined || isNaN(requestConfig.secrets.version)) {
        throw new Error("Missing or invalid 'donHostedSecretsVersion' in final-request.js. " +
                            "Please update it with the version from your upload-secrets.js output.");
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    console.log(`Connected with signer: ${await signer.getAddress()}`);
    console.log(`Targeting consumer contract: ${consumerContractAddress}`);
    console.log(`Using Chainlink Functions Subscription ID: ${requestConfig.subscriptionId}`);
    console.log(`Using DON ID: ${requestConfig.donId}`);
    console.log(`Using DON-hosted secrets (slotId: ${requestConfig.secrets.slotId}, version: ${requestConfig.secrets.version})`);
    console.log("--------------------------------------------------");

    // --- 2. Get contract instance ---
    const DeFiAIChatbot = await ethers.getContractFactory("DeFiAIChatbot", signer);
    const consumerContract = await DeFiAIChatbot.attach(consumerContractAddress);

    // --- 3. Set up event listener for the response ---
    console.log("Waiting for ResponseReceived event from the contract...");
    let responseReceivedPromise = new Promise((resolve, reject) => {
        consumerContract.once("ResponseReceived", (requestId, response, err) => {
            console.log("\n--- Response Received! ---");
            console.log(`Request ID: ${requestId}`);

            if (err && err.length > 0) {
                try {
                    const errorString = ethers.utils.toUtf8String(err);
                    console.error(`Error: ${errorString}`);
                    reject(new Error(`Chainlink Functions execution failed: ${errorString}`));
                } catch (decodeError) {
                    console.error("Failed to decode error as UTF-8 string. Raw error:", err);
                    console.error("Decoding error:", decodeError);
                    reject(new Error("Chainlink Functions execution failed with undecodable error."));
                }
            } else {
                // Robust decoding based on expectedReturnType, with fallback for common cases
                let decodedResponse;
                try {
                    if (requestConfig.expectedReturnType === "string") {
                        try {
                            decodedResponse = ethers.utils.toUtf8String(response);
                        } catch (e) {
                            // If string decoding fails, try decoding as uint256, given UI behavior
                            console.warn("String decoding failed, attempting uint256 decoding...");
                            decodedResponse = ethers.BigNumber.from(response).toString();
                            console.warn("Decoded as uint256 due to string decoding failure.");
                        }
                    } else if (requestConfig.expectedReturnType === "uint256") {
                        decodedResponse = ethers.BigNumber.from(response).toString();
                    } else {
                        // Fallback for any other unexpected type, try toUtf8String
                        try {
                            decodedResponse = ethers.utils.toUtf8String(response);
                            console.warn(`WARN: Unexpected expectedReturnType: ${requestConfig.expectedReturnType}. Decoded as UTF-8 string.`);
                        } catch (e) {
                            decodedResponse = ethers.utils.hexlify(response); // Fallback to raw hex
                            console.warn(`WARN: Unexpected expectedReturnType: ${requestConfig.expectedReturnType}. Displaying raw hex.`);
                        }
                    }
                    console.log(`Decoded Response: ${decodedResponse}`);
                    resolve(decodedResponse);
                } catch (decodeError) {
                    console.error("Failed to decode response. Raw response:", ethers.utils.hexlify(response));
                    console.error("Decoding error details:", decodeError.message);
                    reject(new Error(`Failed to decode result: ${ethers.utils.hexlify(response)}. Error: ${decodeError.message}`));
                }
            }
        });
    });


    // --- 5. Call the sendRequest function on the contract ---
    console.log("Sending Chainlink Functions request via smart contract...");
    const transaction = await consumerContract.sendRequest(
        requestConfig.source,
        requestConfig.secrets.slotId,
        requestConfig.secrets.version,
        requestConfig.args,
        requestConfig.callbackGasLimit
    );

    console.log(`Transaction sent. Hash: ${transaction.hash}`);
    console.log("Waiting for transaction to be mined...");

    const receipt = await transaction.wait();
    console.log(`Transaction mined in block ${receipt.blockNumber}`);

    // --- 6. Wait for the response event ---
    await responseReceivedPromise;

    console.log("Chainlink Functions request process completed.");
}

// Run the script
main().catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
});
