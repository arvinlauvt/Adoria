// Forgiving on purpose: phone/postcode just count digits (spaces, dashes,
// parens, +country codes all fine) rather than demanding one exact format.

export function validateRequired(v, label) {
  return v && v.trim() ? null : `${label} is required.`;
}

export function validateEmail(v) {
  if (!v || !v.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return "Enter a valid email address.";
  return null;
}

export function validatePhone(v) {
  const digits = (v || "").replace(/\D/g, "");
  if (!digits) return "Phone number is required.";
  if (digits.length < 7 || digits.length > 15) return "Enter a valid phone number.";
  return null;
}

export function validatePostcode(v) {
  const digits = (v || "").replace(/\D/g, "");
  if (!digits) return "Postcode is required.";
  if (digits.length !== 5) return "Malaysian postcodes are 5 digits.";
  return null;
}
