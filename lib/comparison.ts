import { GOVERNMENT_WARNING_TEXT } from './constants';
import type { ComparisonResult, VerificationStatus } from './types';

/**
 * Normalize text for comparison
 * - Case-insensitive
 * - Whitespace normalized
 * - Punctuation normalized (removes periods, commas, hyphens for comparison)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,\-]/g, '') // Remove common punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Exact match for brand name, class/type, and producer fields
 * Handles case-insensitive comparison with punctuation normalization
 */
export function exactMatch(expected: string, extracted: string | null): ComparisonResult {
  if (!extracted || extracted.trim() === '') {
    return { status: 'not_found' };
  }

  const normalizedExpected = normalizeText(expected);
  const normalizedExtracted = normalizeText(extracted);

  if (normalizedExpected === normalizedExtracted) {
    return { status: 'match' };
  }

  return {
    status: 'mismatch',
    details: `Expected: "${expected}", Got: "${extracted}"`,
  };
}

/**
 * Extract numeric value from alcohol content string
 */
function extractAlcoholPercentage(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Alcohol content match - exact percentage match required
 * Normalizes format differences (e.g., "45% Alc./Vol." vs "45% ABV")
 */
export function alcoholMatch(expected: string, extracted: string | null): ComparisonResult {
  if (!extracted || extracted.trim() === '') {
    return { status: 'not_found' };
  }

  const expectedPercent = extractAlcoholPercentage(expected);
  const extractedPercent = extractAlcoholPercentage(extracted);

  if (expectedPercent === null || extractedPercent === null) {
    return exactMatch(expected, extracted);
  }

  // Exact percentage match required
  if (expectedPercent === extractedPercent) {
    return { status: 'match' };
  }

  return {
    status: 'mismatch',
    details: `Expected: ${expected}, Got: ${extracted}`,
  };
}

/**
 * Extract numeric value and unit from volume string
 */
function extractVolume(text: string): { value: number; unit: string } | null {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(ml|l|oz|fl\s*oz)/i);

  if (!match) return null;

  return {
    value: parseFloat(match[1]),
    unit: match[2].replace(/\s+/g, '').toLowerCase(),
  };
}

/**
 * Volume/net contents match - exact value and unit required
 */
export function volumeMatch(expected: string, extracted: string | null): ComparisonResult {
  if (!extracted || extracted.trim() === '') {
    return { status: 'not_found' };
  }

  const expectedVol = extractVolume(expected);
  const extractedVol = extractVolume(extracted);

  // If we can parse both as volumes, compare the numeric values and units
  if (expectedVol && extractedVol) {
    if (expectedVol.value === extractedVol.value && expectedVol.unit === extractedVol.unit) {
      return { status: 'match' };
    }
    return {
      status: 'mismatch',
      details: `Expected: "${expected}", Got: "${extracted}"`,
    };
  }

  // Fall back to exact text matching if parsing fails
  return exactMatch(expected, extracted);
}

/**
 * Government warning exact match - strict validation
 * Accepts both standard capitalization and all-caps version
 */
export function warningMatch(expected: string, extracted: string | null): ComparisonResult {
  if (!extracted || extracted.trim() === '') {
    return { status: 'not_found', details: 'Government warning not found on label' };
  }

  const expectedText = expected || GOVERNMENT_WARNING_TEXT;

  // Check if "GOVERNMENT WARNING:" is in all caps
  if (!extracted.includes('GOVERNMENT WARNING:')) {
    if (extracted.toLowerCase().includes('government warning')) {
      return {
        status: 'mismatch',
        details: '"GOVERNMENT WARNING:" must be in all capital letters',
      };
    }
  }

  // Normalize whitespace for comparison
  const normalizedExpected = expectedText.replace(/\s+/g, ' ').trim();
  const normalizedExtracted = extracted.replace(/\s+/g, ' ').trim();

  // Accept exact match with standard capitalization
  if (normalizedExpected === normalizedExtracted) {
    return { status: 'match' };
  }

  // Accept all-caps version
  if (normalizedExpected.toUpperCase() === normalizedExtracted.toUpperCase()) {
    return { status: 'match' };
  }

  return {
    status: 'mismatch',
    details: 'Government warning text does not match required format. Must match word-for-word including punctuation.',
  };
}

/**
 * Compare a single field between expected and extracted values
 */
export function compareField(
  fieldName: string,
  expected: string,
  extracted: string | null
): ComparisonResult {
  if (!expected || expected.trim() === '') {
    // If expected is empty, we don't check this field
    return { status: 'match' };
  }

  switch (fieldName) {
    case 'alcoholContent':
      return alcoholMatch(expected, extracted);
    case 'netContents':
      return volumeMatch(expected, extracted);
    case 'governmentWarning':
      return warningMatch(expected, extracted);
    case 'brandName':
    case 'classType':
    case 'producerNameAddress':
    case 'countryOfOrigin':
    default:
      return exactMatch(expected, extracted);
  }
}
