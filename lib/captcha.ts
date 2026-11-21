import crypto from "crypto";

const CAPTCHA_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CAPTCHA_LENGTH = 6;
const CAPTCHA_TTL_MS = 10 * 60 * 1000;

interface CaptchaPayload {
  nonce: string;
  hash: string;
  exp: number;
}

const globalForCaptcha = globalThis as unknown as {
  __subraUsedCaptchaNonces?: Map<string, number>;
};

function getUsedNonceStore(): Map<string, number> {
  if (!globalForCaptcha.__subraUsedCaptchaNonces) {
    globalForCaptcha.__subraUsedCaptchaNonces = new Map<string, number>();
  }
  return globalForCaptcha.__subraUsedCaptchaNonces;
}

function pruneExpiredNonces(now: number) {
  const store = getUsedNonceStore();
  if (store.size < 200) return;
  for (const [nonce, exp] of store.entries()) {
    if (exp <= now) {
      store.delete(nonce);
    }
  }
}

function getCaptchaSecret(): string {
  return (
    process.env.CAPTCHA_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "subra-captcha-local-signing-key"
  );
}

function hashAnswer(nonce: string, normalizedCode: string): string {
  return crypto
    .createHmac("sha256", getCaptchaSecret())
    .update(`${nonce}:${normalizedCode}`)
    .digest("hex");
}

function signPayload(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getCaptchaSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function randomInt(min: number, max: number): number {
  return crypto.randomInt(min, max + 1);
}

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CAPTCHA_LENGTH; i += 1) {
    code += CAPTCHA_ALPHABET[crypto.randomInt(0, CAPTCHA_ALPHABET.length)];
  }
  return code;
}

function buildCaptchaSvg(code: string): string {
  const width = 200;
  const height = 56;
  const inkPalette = ["#1d4ed8", "#0f172a", "#0369a1", "#4338ca", "#0f766e", "#b91c1c"];
  const linePalette = ["#93c5fd", "#cbd5e1", "#a5b4fc", "#99f6e4"];

  const noiseLines = Array.from({ length: 5 }, () => {
    const x1 = randomInt(4, 50);
    const y1 = randomInt(6, height - 6);
    const cx = randomInt(65, 135);
    const cy = randomInt(4, height - 4);
    const x2 = randomInt(150, width - 4);
    const y2 = randomInt(6, height - 6);
    const stroke = linePalette[randomInt(0, linePalette.length - 1)];
    return `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" fill="none" stroke="${stroke}" stroke-width="${(randomInt(10, 18) / 10).toFixed(1)}" opacity="0.75" />`;
  }).join("");

  const noiseDots = Array.from({ length: 24 }, () => {
    const cx = randomInt(8, width - 8);
    const cy = randomInt(6, height - 6);
    const r = (randomInt(8, 18) / 10).toFixed(1);
    const fill = linePalette[randomInt(0, linePalette.length - 1)];
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.7" />`;
  }).join("");

  const characters = code
    .split("")
    .map((char, index) => {
      const x = 22 + index * 28 + randomInt(-2, 2);
      const y = 37 + randomInt(-4, 4);
      const rotate = randomInt(-16, 16);
      const fontSize = randomInt(25, 29);
      const fill = inkPalette[randomInt(0, inkPalette.length - 1)];
      return `<text x="${x}" y="${y}" fill="${fill}" font-size="${fontSize}" font-weight="700" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" letter-spacing="1" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="CAPTCHA verification image"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="${width}" height="${height}" rx="10" fill="url(#bg)"/>${noiseLines}${noiseDots}${characters}</svg>`;
}

export function createCaptchaChallenge() {
  const code = generateCode();
  const nonce = crypto.randomBytes(12).toString("hex");
  const exp = Date.now() + CAPTCHA_TTL_MS;
  const payload: CaptchaPayload = {
    nonce,
    hash: hashAnswer(nonce, code),
    exp,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload);
  const token = `${encodedPayload}.${signature}`;
  const svg = buildCaptchaSvg(code);
  const imageDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return {
    token,
    imageDataUrl,
    expiresAt: exp,
  };
}

export function verifyCaptchaToken(
  token: unknown,
  answer: unknown
): { valid: true } | { valid: false; error: string } {
  const rawToken = typeof token === "string" ? token.trim() : "";
  const rawAnswer = typeof answer === "string" ? answer.trim().toUpperCase() : "";

  if (!rawAnswer) {
    return { valid: false, error: "Please enter the CAPTCHA code." };
  }

  if (!rawToken || !rawToken.includes(".")) {
    return {
      valid: false,
      error: "CAPTCHA session is missing or invalid. Please refresh the CAPTCHA.",
    };
  }

  const [encodedPayload, signature] = rawToken.split(".");
  if (!encodedPayload || !signature) {
    return {
      valid: false,
      error: "CAPTCHA session is invalid. Please refresh and try again.",
    };
  }

  const expectedSignature = signPayload(encodedPayload);
  const sigBuf = Buffer.from(signature);
  const expectedSigBuf = Buffer.from(expectedSignature);
  if (
    sigBuf.length !== expectedSigBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedSigBuf)
  ) {
    return {
      valid: false,
      error: "CAPTCHA verification failed. Please refresh and try again.",
    };
  }

  let payload: CaptchaPayload;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as CaptchaPayload;
  } catch {
    return {
      valid: false,
      error: "CAPTCHA verification failed. Please refresh and try again.",
    };
  }

  const now = Date.now();
  pruneExpiredNonces(now);

  if (!payload.nonce || !payload.hash || !payload.exp || payload.exp <= now) {
    return {
      valid: false,
      error: "CAPTCHA has expired. Please refresh and try again.",
    };
  }

  const usedStore = getUsedNonceStore();
  if (usedStore.has(payload.nonce)) {
    return {
      valid: false,
      error: "CAPTCHA has already been used. Please enter the new code.",
    };
  }

  const candidateHash = hashAnswer(payload.nonce, rawAnswer);
  const hashBuf = Buffer.from(candidateHash);
  const expectedHashBuf = Buffer.from(payload.hash);
  if (
    hashBuf.length !== expectedHashBuf.length ||
    !crypto.timingSafeEqual(hashBuf, expectedHashBuf)
  ) {
    usedStore.set(payload.nonce, payload.exp);
    return {
      valid: false,
      error: "Incorrect CAPTCHA code. Please enter the new code shown.",
    };
  }

  usedStore.set(payload.nonce, payload.exp);
  return { valid: true };
}

