const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { Location, CodeLanguage } = require("@chainlink/functions-toolkit");

// --- Configuration ---
const consumerContractAddress = process.env.FUNCTIONS_CONSUMER_CONTRACT_ADDRESS;
if (!consumerContractAddress) {
  console.warn(
    "FUNCTIONS_CONSUMER_CONTRACT_ADDRESS not found in .env. Ensure your consumer contract is deployed."
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
const secretsSlotId = 0;
const donHostedSecretsVersion = 1750960986; // <<<--- ENSURE THIS IS YOUR ACTUAL VERSION

if (!donHostedSecretsVersion || isNaN(donHostedSecretsVersion)) {
    throw new Error(
        "Please update 'donHostedSecretsVersion' in final-request.js with the version " +
        "from your `upload-secrets.js` script output (e.g., `version: 123`)."
    );
}

// --- Request Configuration ---
const requestConfig = {
  source: functionsSource,
  codeLocation: Location.Inline,
  codeLanguage: CodeLanguage.JavaScript,

  secretsLocation: Location.DONHosted,
  secrets: {
    slotId: secretsSlotId,
    version: donHostedSecretsVersion,
  },

  // --- CRITICAL FIX: ADD YOUR USER QUERY HERE (MADE SHORTER) ---
  // This will be passed as args[0] to your functions-source.js
  args: ["Briefly, what is the current market cap of Ethereum and Bitcoin?"], // <--- Example: Shorter query

  expectedReturnType: "string",
  subscriptionId: Number(subscriptionId),
  donId: donId,
  callbackGasLimit: 200_000,
};

module.exports = requestConfig;
