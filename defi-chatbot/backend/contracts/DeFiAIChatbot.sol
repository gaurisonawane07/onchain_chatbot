// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Adjust import paths if 'dev' is not correct for your @chainlink/contracts version
import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/dev/v1_0_0/libraries/FunctionsRequest.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

/**
 * @title DeFiAIChatbot
 * @notice This contract integrates Chainlink Functions to enable a DeFi AI Chatbot.
 * It sends requests to an off-chain JavaScript (functions-source.js) which
 * can interact with APIs (like Gemini) using securely stored API keys.
 */
contract DeFiAIChatbot is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables
    uint64 public s_subscriptionId; // Your Chainlink Functions Subscription ID
    bytes32 public s_lastRequestId; // Stores the ID of the last Chainlink Functions request
    bytes public s_lastResponse;    // Stores the raw bytes response from the DON (safer than string)
    bytes public s_lastError;       // Stores the raw bytes error message from the DON

    address private s_router;       // Chainlink Functions Router address
    bytes32 private s_donId;        // DON ID (e.g., "fun-ethereum-sepolia-1" in bytes32)

    // --- CRITICAL FIX: EVENT DECLARATION ADDED ---
    event RequestSent(bytes32 indexed requestId, uint64 subscriptionId, bytes32 donId, string[] args);
    event ResponseReceived(bytes32 indexed requestId, bytes response, bytes err);

    /**
     * @notice Constructor to initialize the FunctionsClient with the router address,
     * DON ID, and subscription ID, and set the contract deployer as the owner.
     * @param routerAddress The address of the Chainlink Functions Router on Sepolia.
     * @param donIdBytes The DON ID as bytes32 (e.g., `bytes32("fun-ethereum-sepolia-1")`).
     * @param subscriptionId_ Your Chainlink Functions Subscription ID.
     */
    constructor(
        address routerAddress,
        bytes32 donIdBytes,       // CRITICAL FIX: Added donIdBytes to constructor
        uint64 subscriptionId_   // CRITICAL FIX: Added subscriptionId_ to constructor
    )
        FunctionsClient(routerAddress)
        ConfirmedOwner(msg.sender) // Sets msg.sender as owner
    {
        s_router = routerAddress;
        s_donId = donIdBytes;           // CRITICAL FIX: Initialize s_donId
        s_subscriptionId = subscriptionId_; // Initialize s_subscriptionId
    }

    /**
     * @notice Allows the owner to update the Chainlink Functions Subscription ID.
     * This ID is used to pay for off-chain computations.
     * @param newSubscriptionId The new subscription ID to use.
     */
    function updateSubscriptionId(uint64 newSubscriptionId) external onlyOwner {
        s_subscriptionId = newSubscriptionId;
    }

    /**
     * @notice Allows the owner to update the DON ID.
     * @param newDonIdBytes The new DON ID to use.
     */
    function updateDonId(bytes32 newDonIdBytes) external onlyOwner {
        s_donId = newDonIdBytes;
    }


    /**
     * @notice Sends a request to the Chainlink Functions DON.
     * @param source The JavaScript source code that the DON will execute.
     * @param donHostedSecretsSlotId The slot ID where your encrypted secrets are stored on the DON.
     * @param donHostedSecretsVersion The version of your encrypted secrets at the specified slot.
     * @param args An array of string arguments to pass to your JavaScript source code.
     * @param callbackGasLimit The maximum amount of gas the DON can use to call `fulfillRequest`
     * on this contract. Max is 300,000.
     * @return requestId The ID of the Chainlink Functions request.
     */
    function sendRequest(
        string calldata source,
        uint8 donHostedSecretsSlotId,
        uint64 donHostedSecretsVersion,
        string[] calldata args,
        uint32 callbackGasLimit
    ) external onlyOwner returns (bytes32) {
        // Initialize a new FunctionsRequest
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);

        // Add DON-hosted secrets reference to the request
        req.addDONHostedSecrets(donHostedSecretsSlotId, donHostedSecretsVersion);

        // Set the arguments to be passed to the JavaScript source code
        if (args.length > 0) {
            req.setArgs(args);
        }

        // Send the request to the Chainlink Functions router
        bytes32 id = _sendRequest(
            req.encodeCBOR(),
            s_subscriptionId,
            callbackGasLimit,
            s_donId // CRITICAL FIX: Use the correctly initialized s_donId here
        );
        s_lastRequestId = id; // Store the request ID for tracking

        emit RequestSent(s_lastRequestId, s_subscriptionId, s_donId, args);

        return id;
    }

    /**
     * @notice Callback function called by the Chainlink Functions DON after fulfilling a request.
     * This function stores the response or error received from the off-chain computation.
     * @param requestId The ID of the original request.
     * @param response The bytes response from the off-chain computation.
     * @param err The bytes error message if the off-chain computation failed.
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        // Optional: Verify that the response corresponds to the last request made by this contract
        if (requestId != s_lastRequestId) {
             // For simplicity, we'll revert if it's not the last expected request
             // For concurrent requests, you might store results in a mapping by requestId
             revert("Unexpected request ID received in fulfillRequest");
        }

        s_lastResponse = response; // CRITICAL FIX: Store as bytes
        s_lastError = err;

        emit ResponseReceived(requestId, response, err); // CRITICAL FIX: Emit the event
    }

    // Public getter functions for state variables
    function getLatestResponse() public view returns (bytes memory) {
        return s_lastResponse;
    }

    function getLatestError() public view returns (bytes memory) {
        return s_lastError;
    }

    function getSubscriptionId() public view returns (uint64) {
        return s_subscriptionId;
    }

    function getDonId() public view returns (bytes32) {
        return s_donId;
    }

    function getRouterAddress() public view returns (address) {
        return s_router;
    }
}
