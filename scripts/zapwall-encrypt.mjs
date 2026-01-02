#!/usr/bin/env node
/**
 * Zapwall encryption helper (offline)
 *
 * This produces an encrypted payload JSON that can be embedded in HTML:
 * <script type="application/json" data-zapwall-payload>{...}</script>
 *
 * IMPORTANT: This does NOT solve key distribution.
 * You must deliver the key to paying users via a secure channel (server, Nostr DM, manual, etc.).
 */

import { readFileSync } from "node:fs";
import { randomBytes, createCipheriv } from "node:crypto";

const usage = () => {
  console.error("Usage: node scripts/zapwall-encrypt.mjs <inputFile> [--format html|text] [--key <base64|hex>] [--key-hint <string>]");
  process.exit(1);
};

const args = process.argv.slice(2);
if (args.length < 1) usage();

const inputFile = args[0];
let format = "html";
let keyArg = null;
let keyHint = null;

for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === "--format") {
    format = String(args[++i] || "html");
  } else if (a === "--key") {
    keyArg = String(args[++i] || "");
  } else if (a === "--key-hint") {
    keyHint = String(args[++i] || "");
  }
}

const plaintext = readFileSync(inputFile);

const parseKey = (raw) => {
  if (!raw) return null;
  const s = raw.trim();
  if (/^(hex:)?[0-9a-fA-F]{64}$/.test(s)) {
    const clean = s.replace(/^hex:/i, "");
    return Buffer.from(clean, "hex");
  }
  const cleanB64 = s.replace(/^base64:/i, "");
  return Buffer.from(cleanB64, "base64");
};

const key = parseKey(keyArg) || randomBytes(32);
if (key.length !== 32) {
  console.error("Key must be 32 bytes (256-bit)");
  process.exit(1);
}

const iv = randomBytes(12);
const cipher = createCipheriv("aes-256-gcm", key, iv);
const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);

const payload = {
  v: 1,
  alg: "AES-256-GCM",
  iv: iv.toString("base64"),
  ct: ct.toString("base64"),
  format: (format === "text") ? "text" : "html",
};

if (keyHint) payload.keyHint = keyHint;

process.stdout.write(JSON.stringify({
  payload,
  key: key.toString("hex"),
}, null, 2));
process.stdout.write("\n");
