import { LOGGER } from '../lib/logger';

export type CardBrand = 'visa'|'mastercard'|'amex'|'elo'|'hipercard'|'diners'|'discover'|'unknown';

export interface TokenizeInput {
  pan: string;
  expMonth: number;
  expYear: number;
  cvv: string;
  name: string;
  cpf?: string;
}

export interface TokenizeOutput {
  token: string;
  brand: CardBrand;
  last4: string;
}

export const sanitizeDigits = (value: string) => (value || '').replace(/\D+/g, '');

// Simplified brand detection via regex/prefixes
export function detectBrand(panRaw: string): CardBrand {
  const pan = sanitizeDigits(panRaw);
  if (/^4\d{12}(\d{3})?$/.test(pan)) return 'visa';
  if (/^(5[1-5]\d{14}|2(2[2-9]\d|[3-6]\d{2}|7[01]\d|720)\d{12})$/.test(pan)) return 'mastercard';
  if (/^3[47]\d{13}$/.test(pan)) return 'amex';
  // Common Elo ranges (simplified)
  if (/^(4011|4312|4389|4514|4576|5041|5067|509|6277|6362|650|6516|6550)\d+/.test(pan)) return 'elo';
  if (/^(606282|3841)\d+/.test(pan)) return 'hipercard';
  if (/^3(?:0[0-5]|[68])\d{11}$/.test(pan)) return 'diners';
  if (/^6(?:011|5\d{2})\d{12}$/.test(pan)) return 'discover';
  return 'unknown';
}

export function getExpectedLength(brand: CardBrand): number | [number, number] {
  switch (brand) {
    case 'amex': return 15;
    case 'diners': return 14;
    case 'visa':
    case 'mastercard':
    case 'elo':
    case 'hipercard':
    case 'discover':
      return 16;
    default:
      return [13, 19]; // generic range
  }
}

// Luhn check and reject obvious sequences (all equal digits)
export function luhnCheck(panRaw: string): boolean {
  const pan = sanitizeDigits(panRaw);
  if (!pan) return false;
  if (/^(\d)\1{5,}$/.test(pan)) return false; // six+ equal digits
  let sum = 0;
  let shouldDouble = false;
  for (let i = pan.length - 1; i >= 0; i--) {
    let digit = parseInt(pan.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// Masks
export function formatPanWithMask(panRaw: string, brand?: CardBrand): string {
  const pan = sanitizeDigits(panRaw);
  const b = brand || detectBrand(pan);
  if (b === 'amex') {
    // 4-6-5
    return [pan.slice(0, 4), pan.slice(4, 10), pan.slice(10, 15)].filter(Boolean).join(' ');
  }
  if (b === 'diners') {
    // 4-6-4
    return [pan.slice(0, 4), pan.slice(4, 10), pan.slice(10, 14)].filter(Boolean).join(' ');
  }
  // default 4-4-4-4
  return [pan.slice(0, 4), pan.slice(4, 8), pan.slice(8, 12), pan.slice(12, 16)].filter(Boolean).join(' ');
}

export function formatExpToMonthYear(expRaw: string): { expMonth: number; expYear: number } | null {
  const exp = (expRaw || '').trim();
  const m = exp.match(/^(\d{2})\/(\d{2})$/);
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const yy = parseInt(m[2], 10);
  if (month < 1 || month > 12) return null;
  const year = 2000 + yy;
  return { expMonth: month, expYear: year };
}

export function isExpValid(expMonth: number, expYear: number): boolean {
  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  if (expYear < curYear) return false;
  if (expYear === curYear && expMonth < curMonth) return false;
  if (expYear > curYear + 15) return false; // max +15 years
  return true;
}

export function isExpSoon(expMonth: number, expYear: number): boolean {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const monthsLeft = (expYear - curYear) * 12 + (expMonth - curMonth);
  return monthsLeft <= 2 && monthsLeft >= 0;
}

export function validateCVC(cvcRaw: string, brand: CardBrand): boolean {
  const cvc = cvcRaw.replace(/\D+/g, '');
  if (brand === 'amex') return /^\d{4}$/.test(cvc);
  return /^\d{3}$/.test(cvc);
}

export function validateHolderName(nameRaw: string): boolean {
  const name = (nameRaw || '').trim();
  if (name.length < 2 || name.length > 50) return false;
  // letters, accents, spaces, hyphens; at least two words
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\- ]+$/.test(name)) return false;
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.length >= 2;
}

// CPF helpers (optional)
export function formatCPFMask(cpfRaw: string): string {
  const v = sanitizeDigits(cpfRaw).slice(0, 11);
  const p1 = v.slice(0, 3);
  const p2 = v.slice(3, 6);
  const p3 = v.slice(6, 9);
  const p4 = v.slice(9, 11);
  return [p1, p2, p3].filter(Boolean).join('.') + (p4 ? '-' + p4 : '');
}

export function validateCPF(cpfRaw: string): boolean {
  let str = sanitizeDigits(cpfRaw);
  if (str.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(str)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(str.charAt(i)) * (10 - i);
  let dv1 = (sum * 10) % 11; if (dv1 === 10) dv1 = 0;
  if (dv1 !== parseInt(str.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(str.charAt(i)) * (11 - i);
  let dv2 = (sum * 10) % 11; if (dv2 === 10) dv2 = 0;
  return dv2 === parseInt(str.charAt(10));
}

export function tokenize(input: TokenizeInput): TokenizeOutput {
  // Do NOT log sensitive values
  const brand = detectBrand(input.pan);
  const pan = sanitizeDigits(input.pan);
  const last4 = pan.slice(-4);
  const token = `tok_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  // Log only non-sensitive metadata
  LOGGER.STORE.info('tokenize.mock', { brand, last4 });
  return { token, brand, last4 };
}

export function validatePanAndBrand(panRaw: string): { brand: CardBrand; valid: boolean } {
  const brand = detectBrand(panRaw);
  const pan = sanitizeDigits(panRaw);
  const len = pan.length;
  const expected = getExpectedLength(brand);
  const lenOk = Array.isArray(expected) ? (len >= expected[0] && len <= expected[1]) : len === expected;
  const luhnOk = luhnCheck(pan);
  return { brand, valid: lenOk && luhnOk };
}