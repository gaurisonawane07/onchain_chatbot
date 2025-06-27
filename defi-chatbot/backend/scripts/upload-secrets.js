/**
 * Encrypt your GEMINI_API_KEY and upload it to the Sepolia DON.
 *
 * Run:  node scripts/upload-secrets.js
 * Out :  slotId  version   ← copy both into final-request.js
 */
require("dotenv").config();
const { SecretsManager } = require("@chainlink/functions-toolkit");
const { ethers } = require("ethers");

/* ─── Network constants ──────────────────────────────────────────────────── */
const ROUTER_SEPOLIA  = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
const DON_ID          = "fun-ethereum-sepolia-1";
const GATEWAY_URLS    = [
  "https://01.functions-gateway.testnet.chain.link/",
  "https://02.functions-gateway.testnet.chain.link/",
];

/* ─── Env sanity-check ───────────────────────────────────────────────────── */
["PRIVATE_KEY","RPC_URL","FUNCTIONS_SUBSCRIPTION_ID","GEMINI_API_KEY"].forEach(
  (key) => { if (!process.env[key]) { console.error(`❌ ${key} missing in .env`); process.exit(1); } }
);

(async () => {
  /* Signer */
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Signer :", await signer.getAddress());
  console.log("Router :", ROUTER_SEPOLIA);
  console.log("DON ID :", DON_ID);
  console.log("Sub-ID :", process.env.FUNCTIONS_SUBSCRIPTION_ID);
  console.log("─────────────────────────────────────────────────────────────");

  /* SecretsManager — note the key `functionsRouterAddress` */
  const secretsManager = new SecretsManager({
    signer,
    functionsRouterAddress: ROUTER_SEPOLIA,
    donId: DON_ID,
    subscriptionId: Number(process.env.FUNCTIONS_SUBSCRIPTION_ID),
  });
  await secretsManager.initialize();

  /* Encrypt */
  const { encryptedSecrets } = await secretsManager.encryptSecrets({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });

  /* Upload */
  const uploadRes = await secretsManager.uploadEncryptedSecretsToDON({
    encryptedSecretsHexstring: encryptedSecrets,
    gatewayUrls: GATEWAY_URLS,
    slotId: 0,                 // first free slot
    minutesUntilExpiration: 4320, // 3 days
  });

  if (!uploadRes.success) throw new Error("Upload failed on one or more nodes");

  console.log("✅ Secrets uploaded!");
  console.log("   slotId :", 0);
  console.log("   version:", uploadRes.version);
})().catch((e) => {
  console.error("Upload error:", e);
  process.exit(1);
});
