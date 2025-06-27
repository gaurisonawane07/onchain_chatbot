const { task } = require("hardhat/config");
const fs = require("fs");
const path = require("path");
const { simulateScript } = require("@chainlink/functions-toolkit"); // Import simulateScript

// Define a new Hardhat task for local Functions simulation
task("simulate-functions-locally", "Simulates the Chainlink Functions JavaScript locally")
  .setAction(async () => {
    console.log("Starting local Chainlink Functions simulation...");

    // --- 1. Load functions-source.js ---
    const functionsSourcePath = path.join(__dirname, "../scripts/functions-source.js");
    if (!fs.existsSync(functionsSourcePath)) {
      throw new Error(`functions-source.js not found at: ${functionsSourcePath}`);
    }
    const functionsSource = fs.readFileSync(functionsSourcePath).toString();

    // --- 2. Load secrets.json ---
    const secretsPath = path.join(__dirname, "../secrets.json");
    if (!fs.existsSync(secretsPath)) {
      throw new Error(`secrets.json not found at: ${secretsPath}. Please create it.`);
    }
    const secrets = JSON.parse(fs.readFileSync(secretsPath, "utf8"));

    // --- 3. Define arguments for your functions-source.js ---
    // This is the query you want to send to Gemini
    const args = ["What is the current market cap of Ethereum and Bitcoin today?"]; // <--- Customize your query here

    // --- 4. Define expected return type ---
    const expectedReturnType = "string"; // Adjust if your functions-source.js returns something else

    console.log("Loaded functions-source.js and secrets.json.");
    console.log(`Simulating with args: ${JSON.stringify(args)}`);

    try {
      // Call simulateScript directly from functions-toolkit
      const {
        result, // Raw result (bytes)
        success, // Boolean indicating success
        error, // Error message if not successful
        capturedTerminalOutput, // Console logs from the Functions script
      } = await simulateScript({
        source: functionsSource,
        args: args,
        secrets: secrets, // Pass the parsed secrets object directly
        expectedReturnType: expectedReturnType,
      });

      console.log("\n--- Simulation Results ---");
      if (success) {
        console.log("Simulation SUCCESS!");
        console.log("Raw Result (bytes):", result);
        // Attempt to decode if expected to be a string
        try {
            const decodedResult = Buffer.from(result.substring(2), 'hex').toString('utf8'); // Decode hex to UTF-8
            console.log("Decoded Result:", decodedResult);
        } catch (e) {
            console.warn("Could not decode result as UTF-8 string:", e.message);
        }
      } else {
        console.error("Simulation FAILED!");
        console.error("Error String:", error);
      }
      console.log("\n--- Captured Functions Script Console Output ---");
      console.log(capturedTerminalOutput);
      console.log("----------------------------------------------");

    } catch (e) {
      console.error("An unexpected error occurred during simulation:", e);
    }
  });
