import { GoogleGenerativeAI } from '@google/generative-ai';
import { EXTRACTION_PROMPT } from './constants';
import type { GeminiExtractionResponse, ExtractedValues } from './types';

// Initialize Gemini API client
const apiKey = process.env.GOOGLE_AI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Extracts label information from an image using Gemini 3 Flash
 * @param imageBase64 - Base64 encoded image string (without data:image prefix)
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg')
 * @returns Extracted values from the label
 */
export async function extractLabelData(
  imageBase64: string,
  mimeType: string
): Promise<ExtractedValues> {
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
  }

  try {
    // Initialize the model with low thinking level for speed
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });

    // Prepare the image data
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ];

    // Generate content with the prompt and image
    const result = await model.generateContent([EXTRACTION_PROMPT, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed: GeminiExtractionResponse = JSON.parse(cleanedText);

    // Map to ExtractedValues format
    const extractedValues: ExtractedValues = {
      brandName: parsed.brand_name,
      classType: parsed.class_type,
      alcoholContent: parsed.alcohol_content,
      netContents: parsed.net_contents,
      producerNameAddress: parsed.producer_name_address,
      countryOfOrigin: parsed.country_of_origin,
      governmentWarning: parsed.government_warning,
    };

    return extractedValues;
  } catch (error) {
    console.error('Error extracting label data:', error);
    throw new Error(
      `Failed to extract label data: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Converts a data URL to base64 string and MIME type
 * @param dataUrl - Data URL string (data:image/jpeg;base64,...)
 * @returns Object with base64 string and MIME type
 */
export function parseDataUrl(dataUrl: string): { base64: string; mimeType: string } {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid data URL format');
  }
  return {
    mimeType: matches[1],
    base64: matches[2],
  };
}
