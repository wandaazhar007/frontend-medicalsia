// Formats as the user types into groups of 4 (0812-3456-7890) and normalizes
// a leading country code (62...) back to the local 0-prefix form.
export function formatPhoneNumber(value) {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('62')) digits = `0${digits.slice(2)}`;
  digits = digits.slice(0, 13);
  return [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 13)].filter(Boolean).join('-');
}

export function countPhoneDigits(value) {
  return value.replace(/\D/g, '').length;
}
