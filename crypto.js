const PBKDF2_ITERATIONS = 250000;

function bufToB64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function b64ToBuf(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function randomBytes(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return arr;
}

async function deriveKey(password, saltBytes, iterations = PBKDF2_ITERATIONS) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptJSON(key, obj) {
  const iv = randomBytes(12);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(obj));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext,
  );
  return { iv: bufToB64(iv), data: bufToB64(ciphertext) };
}

async function decryptJSON(key, ivB64, dataB64) {
  const iv = new Uint8Array(b64ToBuf(ivB64));
  const ciphertext = b64ToBuf(dataB64);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plaintext));
}

function generateId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createProfile(name, fields = {}) {
  return { id: generateId(), name, fields };
}

function migrateVaultShape(decrypted) {
  if (decrypted && Array.isArray(decrypted.profiles)) {
    if (!decrypted.activeProfileId && decrypted.profiles[0]) {
      decrypted.activeProfileId = decrypted.profiles[0].id;
    }
    return decrypted;
  }
  const legacyFields =
    decrypted && typeof decrypted === "object" ? decrypted : {};
  const profile = createProfile("Default", legacyFields);
  return { profiles: [profile], activeProfileId: profile.id };
}

const _globalTarget = typeof self !== "undefined" ? self : window;
_globalTarget.VaultCrypto = {
  PBKDF2_ITERATIONS,
  randomBytes,
  bufToB64,
  b64ToBuf,
  deriveKey,
  encryptJSON,
  decryptJSON,
  generateId,
  createProfile,
  migrateVaultShape,
};
