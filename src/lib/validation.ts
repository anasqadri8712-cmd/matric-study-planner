const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Please enter your email.";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email.";
  return null;
}

export function validateLoginPassword(value: string): string | null {
  if (!value) return "Please enter your password.";
  if (value.length < 8) return "Password must contain at least 8 characters.";
  return null;
}

export function validateName(value: string): string | null {
  const name = value.trim();
  if (!name) return "Please enter your full name.";
  if (name.length < 3) return "Name must contain at least 3 characters.";
  if (!/[A-Za-z]/.test(name)) return "Name cannot be only numbers or symbols.";
  if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) return "Name can only contain letters, spaces, . ' and -";
  if (name.replace(/[^A-Za-z]/g, "").length < 3) return "Please enter a real name.";
  return null;
}

export function validateSignupPassword(value: string): string | null {
  if (!value) return "Please enter a password.";
  if (value.length < 8) return "Password must contain at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Password must contain one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must contain one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Password must contain one number.";
  return null;
}

export type Strength = { label: "Weak" | "Medium" | "Strong"; score: number };

export function passwordStrength(value: string): Strength {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score++;
  if (score <= 2) return { label: "Weak", score: 33 };
  if (score === 3) return { label: "Medium", score: 66 };
  return { label: "Strong", score: 100 };
}

export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "Email or password is incorrect.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Too many attempts. Please try again in a moment.";
  if (m.includes("email not confirmed")) return "Please confirm your email first.";
  if (m.includes("network") || m.includes("fetch")) return "No internet connection. Please try again.";
  return "Something went wrong. Please try again.";
}
