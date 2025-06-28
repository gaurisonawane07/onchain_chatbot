const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { Location, CodeLanguage } = require("@chainlink/functions-toolkit");

// --- Configuration ---

const consumerContractAddress = process.env.FUNCTIONS_CONSUMER_CONTRACT_ADDRESS;
if (!consumerContractAddress) {
  // CRITICAL FIX: Throw an error here if address is missing, so it fails early and clearly
  throw new Error(
    "FUNCTIONS_CONSUMER_CONTRACT_ADDRESS not found in .env. Ensure your consumer contract is deployed and its address is set in .env."
  );
}

const subscriptionId = process.env.FUNCTIONS_SUBSCRIPTION_ID;
if (!subscriptionId) {
  throw new Error("FUNCTIONS_SUBSCRIPTION_ID not found in .env");
}

const donId = "fun-ethereum-sepolia-1";

const functionsSourcePath = path.join(__dirname, "functions-source.js");
const functionsSource = fs.readFileSync(functionsSourcePath).toString();

// --- Secrets Configuration ---
// IMPORTANT: Replace these with the exact slotId and version from your
// successful `upload-secrets.js` script output.
const secretsSlotId = 0;

// >>> YOU MUST ENSURE THIS IS YOUR ACTUAL VERSION NUMBER <<<
const donHostedSecretsVersion = 1750960986; // This looks like a valid version number you got from a previous run

if (!donHostedSecretsVersion || isNaN(donHostedSecretsVersion)) {
    throw new Error(
        "Please update 'donHostedSecretsVersion' in final-request.js with the version " +
        "from your `upload-secrets.js` script output (e.g., `version: 123`)."
    );
}

// --- Request Configuration ---
const requestConfig = {
  // CRITICAL FIX: Add consumerContractAddress to the exported requestConfig
  consumerContractAddress: consumerContractAddress, 
  source: functionsSource,
  codeLocation: Location.Inline,
  codeLanguage: CodeLanguage.JavaScript,

  secretsLocation: Location.DONHosted,
  secrets: {
    slotId: secretsSlotId,
    version: donHostedSecretsVersion,
  },

  // --- CRITICAL FIX: PROVIDE YOUR USER QUERY HERE ---
  // This array carries the string arguments to your functions-source.js
  // Your functions-source.js likely expects the query as args[0]
  args: ["Say 'hello'."], // <--- Example: Replace with your actual user query

  // --- CRITICAL FIX: SET EXPECTED RETURN TYPE TO STRING ---
  // A chatbot response will almost certainly be text.
  expectedReturnType: "string", // <--- Changed from "uint256" to "string"

  subscriptionId: Number(subscriptionId),
  donId: donId,
  callbackGasLimit: 300000,
};

module.exports = requestConfig;
