export type BeverageType = 'wine' | 'beer' | 'spirits';

export type VerificationStatus = 'match' | 'mismatch' | 'not_found' | 'partial_match';

export type OverallStatus = 'pass' | 'fail' | 'review_needed';

export interface ExpectedValues {
  brandName: string;
  classType: string;
  alcoholContent: string;
  netContents: string;
  producerNameAddress: string;
  countryOfOrigin?: string;
  beverageType: BeverageType;
}

export interface ExtractedValues {
  brandName: string | null;
  classType: string | null;
  alcoholContent: string | null;
  netContents: string | null;
  producerNameAddress: string | null;
  countryOfOrigin: string | null;
  governmentWarning: string | null;
}

export interface FieldVerificationResult {
  fieldName: string;
  expected: string;
  extracted: string | null;
  status: VerificationStatus;
  details?: string;
}

export interface VerifyRequest {
  image: string; // Base64 encoded image
  expectedValues: ExpectedValues;
}

export interface VerifyResponse {
  success: boolean;
  processingTimeMs: number;
  extractedValues: ExtractedValues;
  verificationResults: FieldVerificationResult[];
  overallStatus: OverallStatus;
}

export interface ComparisonResult {
  status: VerificationStatus;
  details?: string;
}

export interface GeminiExtractionResponse {
  brand_name: string | null;
  class_type: string | null;
  alcohol_content: string | null;
  net_contents: string | null;
  producer_name_address: string | null;
  country_of_origin: string | null;
  government_warning: string | null;
}
