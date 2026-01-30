// Government warning text as required by 27 CFR Part 16
export const GOVERNMENT_WARNING_TEXT = `GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.`;

// Maximum file size in bytes (10MB)
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// API timeout in milliseconds
export const API_TIMEOUT_MS = 8000;

// Accepted image formats
export const ACCEPTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Field display names
export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  brandName: 'Brand Name',
  classType: 'Class/Type',
  alcoholContent: 'Alcohol Content',
  netContents: 'Net Contents',
  producerNameAddress: 'Producer Name & Address',
  countryOfOrigin: 'Country of Origin',
  governmentWarning: 'Government Warning',
};

// Gemini extraction prompt
export const EXTRACTION_PROMPT = `You are analyzing an alcohol beverage label image. Extract the following information exactly as it appears on the label.

IMPORTANT:
- Extract text EXACTLY as shown, preserving capitalization and punctuation
- If a field is not visible or not legible, return null for that field
- For the government warning, capture the COMPLETE text including "GOVERNMENT WARNING:" prefix

Extract these fields:
1. brand_name - The product brand name
2. class_type - The class or type designation (e.g., "Kentucky Straight Bourbon Whiskey", "Red Wine", "Lager")
3. alcohol_content - The alcohol percentage statement (e.g., "45% Alc./Vol.", "12.5% ABV")
4. net_contents - The volume statement (e.g., "750 mL", "12 FL OZ")
5. producer_name_address - The bottler/producer name and address (city and state)
6. country_of_origin - Country of origin if shown (for imports)
7. government_warning - The COMPLETE health warning statement, exactly as printed

Respond with ONLY valid JSON in this exact format:
{
  "brand_name": "...",
  "class_type": "...",
  "alcohol_content": "...",
  "net_contents": "...",
  "producer_name_address": "...",
  "country_of_origin": "..." or null,
  "government_warning": "..."
}`;
