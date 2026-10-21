export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  return { valid: true };
};

// Generates a random password that always satisfies validatePassword
// (>= 8 chars with at least one uppercase). Includes lowercase, digits
// and a symbol so auto-created accounts get a strong credential.
export const generateRandomPassword = (length = 12): string => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "@#$%&*!?";
  const all = upper + lower + digits + symbols;

  const pick = (set: string) =>
    set[Math.floor(Math.random() * set.length)];

  const size = Math.max(length, 8);
  const required = [pick(upper), pick(lower), pick(digits), pick(symbols)];

  const rest = Array.from({ length: size - required.length }, () => pick(all));
  const chars = [...required, ...rest];

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};
