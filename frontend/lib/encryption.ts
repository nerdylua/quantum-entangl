import * as aesjs from "aes-js";
import forge from "node-forge";

/**
 * Generate an RSA-2048 key pair.
 * Returns PEM-encoded public and private keys.
 */
export function generateKeyPair(): {
  publicKey: string;
  privateKey: string;
} {
  const keyPair = forge.pki.rsa.generateKeyPair(2048);
  const publicKey = forge.pki.publicKeyToPem(keyPair.publicKey);
  const privateKey = forge.pki.privateKeyToPem(keyPair.privateKey);
  return { publicKey, privateKey };
}

/**
 * Decrypt an RSA-OAEP encrypted symmetric key.
 * The backend sends 32 raw key bytes encrypted with RSA-OAEP.
 * Returns a 256-char binary string ("01010110...") for use with AES functions.
 * @param encryptedKeyBase64 - Base64-encoded RSA-OAEP ciphertext
 * @param privateKeyPem - PEM-encoded RSA private key
 * @returns The decrypted 256-char binary key string
 */
export function decryptSymmetricKey(
  encryptedKeyBase64: string,
  privateKeyPem: string
): string {
  const encryptedBytes = forge.util.decode64(encryptedKeyBase64);
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const rawBytes = privateKey.decrypt(encryptedBytes, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });
  // Convert raw bytes to 256-char binary string
  return Array.from(rawBytes)
    .map((ch: string) => ch.charCodeAt(0).toString(2).padStart(8, "0"))
    .join("");
}

/**
 * Convert a binary string key (e.g. "01010110...") to a byte Uint8Array for AES.
 * Supports both 128-bit (16 bytes) and 256-bit (32 bytes) keys.
 */
function binaryKeyToBytes(binaryKey: string): Uint8Array {
  const byteLength = binaryKey.length / 8;
  const key = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    key[i] = parseInt(binaryKey.substring(i * 8, i * 8 + 8), 2);
  }
  return key;
}

/**
 * Generate a random 16-byte nonce for AES-CTR.
 */
function generateNonce(): Uint8Array {
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);
  return nonce;
}

/**
 * Encrypt a plaintext message with AES-256-CTR using a random nonce.
 * Output format: hex(nonce) + ":" + hex(ciphertext)
 * @param plaintext - The message to encrypt
 * @param binaryKey - 256-char binary string key
 * @returns Nonce-prefixed hex-encoded ciphertext
 */
export function encryptMessage(plaintext: string, binaryKey: string): string {
  const keyBytes = binaryKeyToBytes(binaryKey);
  const nonce = generateNonce();
  const textBytes = new TextEncoder().encode(plaintext);
  const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(nonce));
  const encryptedBytes = aesCtr.encrypt(textBytes);
  return aesjs.utils.hex.fromBytes(nonce) + ":" + aesjs.utils.hex.fromBytes(encryptedBytes);
}

/**
 * Decrypt a nonce-prefixed hex-encoded ciphertext with AES-256-CTR.
 * Accepts both new format "hex(nonce):hex(ciphertext)" and legacy format "hex(ciphertext)".
 * @param ciphertext - Hex-encoded ciphertext, optionally with nonce prefix
 * @param binaryKey - 256-char binary string key
 * @returns Decrypted plaintext
 */
export function decryptMessage(
  ciphertext: string,
  binaryKey: string
): string {
  const keyBytes = binaryKeyToBytes(binaryKey);

  let nonce: Uint8Array;
  let encryptedHex: string;

  if (ciphertext.includes(":")) {
    // New format: nonce:ciphertext
    const [nonceHex, ctHex] = ciphertext.split(":");
    nonce = new Uint8Array(aesjs.utils.hex.toBytes(nonceHex));
    encryptedHex = ctHex;
  } else {
    // Legacy format: no nonce, use Counter(1) for backward compatibility
    nonce = new Uint8Array(16);
    nonce[15] = 1;
    encryptedHex = ciphertext;
  }

  const encryptedBytes = aesjs.utils.hex.toBytes(encryptedHex);
  const aesCtr = new aesjs.ModeOfOperation.ctr(keyBytes, new aesjs.Counter(nonce));
  const decryptedBytes = aesCtr.decrypt(encryptedBytes);
  return new TextDecoder().decode(new Uint8Array(decryptedBytes));
}
