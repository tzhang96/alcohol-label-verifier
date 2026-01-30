# Product Requirements Document: AI-Powered Alcohol Label Verification App

## Executive Summary

Build a web application that uses AI vision capabilities to verify alcohol beverage labels against application data. The tool helps TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance agents verify that label artwork matches submitted application information, automating the manual field-by-field comparison they currently perform.

**Primary Goal:** Reduce the time agents spend on routine verification tasks (currently 5-10 minutes per label) by automating the "matching" portion of their workflow.

**Hard Constraint:** Response time must be under 5 seconds. A previous pilot failed because 30-40 second processing times caused agents to abandon the tool.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Deployment:** Vercel
- **AI Model:** Google Gemini Flash Lite (`gemini-flash-lite-latest`)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

---

## User Personas

### Primary: Compliance Agents (47 total)
- Age range: Mixed, but half are over 50
- Tech comfort: Varies widely ("Dave prints his emails" to "Jenny could build this herself")
- Key need: Speed and simplicity—"something my mother could figure out"
- Pain point: Drowning in routine verification, processing 150,000 labels/year

### Secondary: Power Users (e.g., Janet from Seattle office)
- Need: Batch processing for large importers who submit 200-300 labels at once
- Currently forced to process one at a time

---

## Core Requirements

### 1. Single Label Verification (MVP - Must Have)

#### 1.1 Application Data Input

The user enters the expected values from the COLA (Certificate of Label Approval) application:

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Brand Name | Text | Required | e.g., "OLD TOM DISTILLERY" |
| Class/Type | Text | Required | e.g., "Kentucky Straight Bourbon Whiskey" |
| Alcohol Content | Text | Required | e.g., "45% Alc./Vol." or "45% ABV" |
| Net Contents | Text | Required | e.g., "750 mL" |
| Producer Name & Address | Text | Required | Name, city, state as on permit |
| Country of Origin | Text | Optional | Required for imports only |
| Beverage Type | Select | Required | Wine, Beer, Distilled Spirits |

#### 1.2 Label Image Upload

- Accept: JPG, PNG, WEBP
- Max file size: 10MB
- Single image upload via click or drag-and-drop
- Show image preview after upload
- Allow removal/replacement of uploaded image

#### 1.3 Verification Processing

When user clicks "Verify Label":

1. Send image to Gemini Flash Lite API with structured extraction prompt
2. Parse extracted fields from response
3. Compare each extracted field against user-provided expected values
4. Return field-by-field verification results

**Performance requirement:** Total time from click to results displayed < 5 seconds

#### 1.4 Results Display

For each field, show:
- Field name
- Expected value (from form)
- Extracted value (from label)
- Status: ✅ MATCH, ❌ MISMATCH, or ⚠️ NOT FOUND
- For mismatches: Visual highlighting of the difference

**Note:** With strict exact matching, "PARTIAL MATCH" status is rarely used. The system performs exact comparisons after normalization (case, whitespace, punctuation).

**Special handling for Government Warning:**
- Must be exact match (word-for-word, punctuation)
- "GOVERNMENT WARNING:" must be in all caps
- Accepts both standard capitalization ("Surgeon General") and all-caps version
- Show specific failure reason if any requirement not met

#### 1.5 Government Warning Reference

Display the required warning text for reference:

```
GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.
```

Note: The agent can copy this text when filling applications.

---

### 2. Batch Upload (Should Have)

#### 2.1 Batch Mode Toggle
- Switch between "Single Label" and "Batch Upload" modes
- Batch mode accepts multiple images at once

#### 2.2 Batch Input Options

**Option A: CSV Upload**
- Upload CSV with columns matching the application fields
- Each row = one label's expected values
- Upload corresponding images (named to match CSV rows)

**Option B: Simplified Batch**
- Upload multiple images
- Enter common fields once (e.g., same producer for all)
- System extracts and displays all fields for review

#### 2.3 Batch Results
- Summary view: X of Y labels passed all checks
- Expandable detail for each label
- Export results as CSV

---

### 3. UI/UX Requirements

#### 3.1 Design Principles

**"My mother could figure it out"** - This is the benchmark.

- Single page application (no navigation required for core flow)
- Large, obvious buttons with clear labels
- No hidden functionality or menus
- High contrast, readable text (many users are 50+)
- Immediate visual feedback for all actions
- Clear error messages in plain English

#### 3.2 Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🏛️ Label Verification Tool                    [Single] [Batch] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐│
│  │                     │    │  APPLICATION DATA               ││
│  │                     │    │                                 ││
│  │   [Drop image here] │    │  Brand Name: [____________]     ││
│  │        or           │    │  Class/Type: [____________]     ││
│  │   [Browse Files]    │    │  Alcohol:    [____________]     ││
│  │                     │    │  Net Contents:[____________]    ││
│  │                     │    │  Producer:   [____________]     ││
│  │                     │    │  Country:    [____________]     ││
│  │                     │    │  Type: [Wine ▼]                 ││
│  └─────────────────────┘    │                                 ││
│                             └─────────────────────────────────┘│
│                                                                 │
│              [ 🔍 VERIFY LABEL ]  (large, prominent button)     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  VERIFICATION RESULTS                                           │
│  ┌────────────────────────────────────────────────────────────┐│
│  │  ✅ Brand Name         Expected: OLD TOM    Got: OLD TOM   ││
│  │  ✅ Alcohol Content    Expected: 45% ABV    Got: 45% ABV   ││
│  │  ❌ Government Warning MISMATCH - "Government Warning"     ││
│  │                        should be "GOVERNMENT WARNING"      ││
│  │  ⚠️ Country of Origin  NOT FOUND on label                  ││
│  └────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [ Clear & Start Over ]                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### 3.3 Responsive Design
- Must work on standard desktop monitors (primary use case)
- Tablet support nice-to-have
- Mobile not required (agents use desktop workstations)

#### 3.4 Loading State
- Show spinner/progress indicator during verification
- Display elapsed time if > 2 seconds
- Allow cancellation if taking too long

---

## Technical Specifications

### 4. API Design

#### 4.1 POST /api/verify

**Request:**
```typescript
interface VerifyRequest {
  image: string; // Base64 encoded image
  expectedValues: {
    brandName: string;
    classType: string;
    alcoholContent: string;
    netContents: string;
    producerNameAddress: string;
    countryOfOrigin?: string;
    beverageType: 'wine' | 'beer' | 'spirits';
  };
}
```

**Response:**
```typescript
interface VerifyResponse {
  success: boolean;
  processingTimeMs: number;
  extractedValues: {
    brandName: string | null;
    classType: string | null;
    alcoholContent: string | null;
    netContents: string | null;
    producerNameAddress: string | null;
    countryOfOrigin: string | null;
    governmentWarning: string | null;
  };
  verificationResults: {
    fieldName: string;
    expected: string;
    extracted: string | null;
    status: 'match' | 'mismatch' | 'not_found' | 'partial_match';
    details?: string; // Explanation for mismatches
  }[];
  overallStatus: 'pass' | 'fail' | 'review_needed';
}
```

#### 4.2 POST /api/verify/batch

**Request:**
```typescript
interface BatchVerifyRequest {
  labels: {
    imageId: string;
    image: string; // Base64
    expectedValues: { /* same as single */ };
  }[];
}
```

**Response:**
```typescript
interface BatchVerifyResponse {
  totalLabels: number;
  passed: number;
  failed: number;
  reviewNeeded: number;
  results: VerifyResponse[]; // Array of individual results
}
```

---

### 5. Gemini Integration

#### 5.1 Model Configuration

```typescript
const modelConfig = {
  model: 'gemini-flash-lite-latest',
  // Optimized for fast, lightweight processing
  // Note: Don't need media_resolution param for standard label images
};
```

#### 5.2 Extraction Prompt

```
You are analyzing an alcohol beverage label image. Extract the following information exactly as it appears on the label.

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
}
```

#### 5.3 Error Handling

- API timeout: 8 seconds (with 5-second soft target)
- Retry logic: 1 retry on transient failures
- Graceful degradation: If extraction fails, return error with guidance

---

### 6. Comparison Logic

#### 6.1 Comparison Functions by Field Type

**Design Philosophy:** For TTB compliance verification, matching logic must be strict to prevent typos and incorrect data from passing validation. All comparisons use exact matching with minimal normalization.

```typescript
// Brand Name, Class/Type, Producer, Country of Origin
function exactMatch(expected: string, extracted: string): ComparisonResult {
  // Case-insensitive comparison
  // Normalize whitespace (multiple spaces → single space)
  // Remove common punctuation (periods, commas, hyphens) for comparison
  // EXACT match required - no fuzzy matching or similarity thresholds
  // Examples:
  //   "OLD TOM DISTILLERY" = "old tom distillery" ✓
  //   "Old Tom Distillery, Inc." = "Old Tom Distillery Inc" ✓
  //   "OLD TOM" ≠ "OLD TIM" ✗ (no typo tolerance)
  //   "Kentucky Bourbon" ≠ "Kentucky Straight Bourbon" ✗
}

// Alcohol Content
function alcoholMatch(expected: string, extracted: string): ComparisonResult {
  // Extract numeric percentage from both strings
  // Normalize formats: "45% ABV" = "45% Alc./Vol." = "45% Alcohol by Volume"
  // EXACT percentage match required (no tolerance)
  // Examples:
  //   "45% ABV" = "45% Alc./Vol." ✓ (same percentage)
  //   "45%" ≠ "45.5%" ✗ (different percentage)
}

// Net Contents
function volumeMatch(expected: string, extracted: string): ComparisonResult {
  // Parse numeric value and unit from both strings
  // Normalize: "750 mL" = "750ml" = "750 ML"
  // EXACT value and unit match required
  // Examples:
  //   "750 mL" = "750ML" ✓
  //   "750 mL" ≠ "700 mL" ✗
}

// Government Warning
function warningMatch(expected: string, extracted: string): ComparisonResult {
  // Check "GOVERNMENT WARNING:" is all caps
  // Accept either standard capitalization OR all-caps version
  // EXACT word-for-word match required (case-insensitive comparison)
  // Whitespace normalized (preserves punctuation)
  // Return specific failure reason if any check fails
}
```

#### 6.2 Government Warning Validation Rules

The warning must pass these checks:
1. Contains exact required text (word-for-word)
2. "GOVERNMENT WARNING:" is in ALL CAPS
3. Punctuation matches (colons, periods, parentheses)
4. Text matches either:
   - Standard capitalization: "Surgeon General" with capital S and G, OR
   - All-caps version: entire warning in uppercase letters

If any check fails, return `mismatch` with specific reason.

---

### 7. Environment Variables

```env
# Required
GOOGLE_AI_API_KEY=your_gemini_api_key

# Optional
MAX_FILE_SIZE_MB=10
API_TIMEOUT_MS=8000
ENABLE_BATCH_MODE=true
```

---

## File Structure

```
alcohol-label-verifier/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Main application page
│   ├── globals.css
│   └── api/
│       ├── verify/
│       │   └── route.ts            # Single label verification endpoint
│       └── verify-batch/
│           └── route.ts            # Batch verification endpoint
├── components/
│   ├── LabelUploader.tsx           # Image upload component
│   ├── ApplicationDataForm.tsx     # Form for expected values
│   ├── VerificationResults.tsx     # Results display
│   ├── BatchUploader.tsx           # Batch mode UI
│   ├── LoadingSpinner.tsx          # Loading state
│   └── WarningReference.tsx        # Government warning reference text
├── lib/
│   ├── gemini.ts                   # Gemini API client
│   ├── comparison.ts               # Field comparison logic
│   ├── types.ts                    # TypeScript interfaces
│   └── constants.ts                # Government warning text, etc.
├── public/
│   └── (static assets)
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## Testing Requirements

### 8.1 Test Labels to Create/Source

Generate or source test labels covering:
1. Clean, well-lit label with all fields visible
2. Label with non-standard font for government warning
3. Label with "Government Warning" (wrong case) - should fail
4. Label photographed at slight angle
5. Label with glare/reflection
6. Wine label with vintage date and appellation
7. Beer label with minimal required fields
8. Import label with country of origin
9. Label with creative/stylized brand name font

### 8.2 Unit Tests

- Comparison functions (all edge cases)
- API request/response validation
- Error handling paths

### 8.3 Integration Tests

- End-to-end verification flow
- Gemini API integration
- Batch processing

### 8.4 Performance Tests

- Verify < 5 second response time under normal conditions
- Test with various image sizes

---

## Documentation

### 9.1 README.md Must Include

- Project overview and purpose
- Setup instructions (local development)
- Environment variable configuration
- Deployment instructions (Vercel)
- API documentation
- Known limitations

### 9.2 Documented Limitations

Include these explicitly:
- Cannot detect bold formatting from image (warning "bold" requirement)
- Cannot verify warning is "separate and apart" from other text
- Image quality affects accuracy
- Not integrated with COLA system (standalone prototype)
- No user authentication (prototype scope)
- No data persistence (results not saved)

---

## Success Criteria

### MVP Complete When:

1. ✅ User can enter application data in form
2. ✅ User can upload a label image
3. ✅ System extracts text from label using Gemini Flash Lite
4. ✅ System compares extracted vs expected values
5. ✅ Results display clearly with pass/fail per field
6. ✅ Government warning gets exact-match validation
7. ✅ Total processing time < 5 seconds
8. ✅ UI is simple enough for non-technical users
9. ✅ Deployed and accessible via URL
10. ✅ README documents setup and limitations

### Stretch Goals (If Time Permits):

1. Batch upload mode
2. CSV export of results
3. Image preprocessing hints (detect blur, suggest retake)
4. Field-specific help tooltips
5. Keyboard navigation support

---

## Out of Scope (Explicitly)

- Integration with TTB COLA system
- User authentication/accounts
- Data persistence/history
- Conditional field logic (e.g., when appellation is required)
- Formula cross-referencing
- Varietal validation against approved lists
- Bold/font detection in images
- Multi-language support

---

## Appendix A: Government Warning Text

The exact required text (27 CFR Part 16):

```
GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.
```

Requirements:
- "GOVERNMENT WARNING:" must be in capital letters and bold type
- Text may be in standard capitalization ("Surgeon General") or all-caps
- Must appear as one contiguous statement
- Must be separate and apart from other information

**Note:** The verification tool accepts both capitalization formats (standard or all-caps) but cannot verify bold formatting or spatial separation from the image.

---

## Appendix B: Sample Test Data

### Test Case 1: Distilled Spirits (Should Pass)

**Expected Values:**
- Brand Name: OLD TOM DISTILLERY
- Class/Type: Kentucky Straight Bourbon Whiskey
- Alcohol Content: 45% Alc./Vol.
- Net Contents: 750 mL
- Producer: Old Tom Distillery, Louisville, KY
- Country: (empty - domestic)

### Test Case 2: Wine with Issues (Should Fail)

**Expected Values:**
- Brand Name: SUNSET VALLEY VINEYARDS
- Class/Type: Chardonnay
- Alcohol Content: 13.5% ABV
- Net Contents: 750 mL
- Producer: Sunset Valley Vineyards, Napa, CA

**Label has:** "Government Warning" instead of "GOVERNMENT WARNING:"

### Test Case 3: Import Beer (Should Pass)

**Expected Values:**
- Brand Name: BRAUHAUS PILS
- Class/Type: German Pilsner
- Alcohol Content: 4.8% ABV
- Net Contents: 12 FL OZ
- Producer: Imported by Global Beverage Co., New York, NY
- Country: Germany

---

## Appendix C: API Key Setup

### Getting a Gemini API Key

1. Go to https://ai.google.dev/
2. Click "Get API key in Google AI Studio"
3. Create new API key
4. Add to `.env.local` as `GOOGLE_AI_API_KEY`

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add `GOOGLE_AI_API_KEY` in Environment Variables
4. Deploy

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-25 | Initial PRD |
| 1.1 | 2025-01-30 | Updated comparison logic to exact matching for TTB compliance. Removed fuzzy matching with 80% similarity threshold. Removed ±0.5% alcohol content tolerance. All fields now require exact match with minimal normalization (case, whitespace, punctuation). Changed AI model from `gemini-3-flash-preview` to `gemini-flash-lite-latest` for faster, more cost-effective processing. |
| 1.2 | 2025-01-30 | Updated government warning validation to accept both standard capitalization and all-caps version of the warning text. |
