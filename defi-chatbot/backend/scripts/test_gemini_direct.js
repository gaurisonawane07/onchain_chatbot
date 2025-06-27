// test_gemini_direct.js

// IMPORTANT: Replace this with your actual Gemini API Key.
// This is for direct testing only and should NOT be hardcoded in production code.
const GEMINI_API_KEY = "AIzaSyBYLZJH4CW_hbt3YbAXRM9D2Idw7QmF_d0"; // <--- PUT YOUR API KEY HERE

// Ensure your query matches what you're using in your functions-source.js
const userQuery = "What is the current market cap of Ethereum and Bitcoin today?";

// The Gemini API endpoint (using the explicit model version)
const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

const headers = {
  "Content-Type": "application/json",
  "x-goog-api-key": GEMINI_API_KEY,
};

const postData = {
  contents: [
    {
      parts: [
        {
          text: userQuery,
        },
      ],
    },
  ],
};

async function callGeminiApi() {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_FULL_GEMINI_API_KEY_HERE") {
    console.error("Error: GEMINI_API_KEY is not set or is still a placeholder. Please update 'test_gemini_direct.js'.");
    return;
  }

  console.log("Attempting direct call to Gemini API...");
  console.log(`URL: ${url}`);
  console.log(`Query: "${userQuery}"`);
  console.log(`API Key (first 5 chars): ${GEMINI_API_KEY.substring(0, 5)}...`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(postData),
      timeout: 15000, // 15-second timeout
    });

    console.log(`\n--- Raw API Response Status: ${response.status} ${response.statusText} ---`);
    const responseData = await response.json(); // Try to parse as JSON

    console.log("--- Raw API Response Body (JSON): ---");
    console.log(JSON.stringify(responseData, null, 2)); // Pretty print JSON

    if (!response.ok) { // Check for HTTP errors (status code not in 2xx range)
      console.error(`\nError: HTTP status ${response.status} detected.`);
      if (responseData.error && responseData.error.message) {
        console.error(`Gemini API Error Message: ${responseData.error.message}`);
      }
      return;
    }

    // Attempt to extract generated text
    const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      console.log("\n--- Gemini Response (Success): ---");
      console.log(generatedText);
    } else {
      console.error("\nError: No generated text found in Gemini response.");
      console.log("Full response data for no text:", JSON.stringify(responseData, null, 2));
    }

  } catch (error) {
    console.error("\n--- Error during direct API call: ---");
    console.error(error);
  }
}

callGeminiApi();
