# Alcohol Label Verification Tool

An AI-powered web application that helps TTB (Alcohol and Tobacco Tax and Trade Bureau) compliance agents verify alcohol beverage labels against application data. This tool automates the field-by-field comparison process, reducing verification time from 5-10 minutes per label to under 5 seconds.

## Features

- **Single Label Verification**: Upload a label image and compare against expected values from COLA applications
- **Batch Upload Processing**: Verify multiple labels at once with CSV data or common values
- **AI-Powered Extraction**: Uses Google Gemini Flash Lite for fast, accurate text extraction from label images
- **Field-by-Field Comparison**: Validates brand name, class/type, alcohol content, net contents, producer information, and government warning
- **Exact Matching**: Strict TTB-compliant validation with normalization for case, whitespace, and punctuation only
- **Government Warning Validation**: Strict word-for-word validation for required health warning text
- **CSV Export**: Export batch verification results to CSV for record-keeping
- **Simple UI**: Designed for non-technical users with clear visual feedback
- **Fast Processing**: <5 second response time for single label verification

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Model**: Google Gemini Flash Lite
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+ and npm
- Google AI API key (for Gemini access)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alcohol-label-verifier
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Google AI API key:

```env
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

#### Getting a Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API key in Google AI Studio"
3. Create a new API key
4. Copy the key to your `.env.local` file

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Visit [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variable:
   - Name: `GOOGLE_AI_API_KEY`
   - Value: Your Gemini API key
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts and add your `GOOGLE_AI_API_KEY` when asked for environment variables.

## Usage

### Single Label Mode

1. **Enter Application Data**: Fill in the expected values from the COLA application in the form on the right
2. **Upload Label Image**: Drag and drop or browse to select a label image (JPG, PNG, or WEBP)
3. **Verify**: Click the "VERIFY LABEL" button
4. **Review Results**: See field-by-field comparison with pass/fail indicators
5. **Start Over**: Use "Clear & Start Over" to verify another label

### Batch Upload Mode

1. **Switch to Batch Mode**: Click the "Batch Upload" button in the header
2. **Upload Multiple Images**: Select multiple label images at once
3. **Choose Data Entry Method**:
   - **Option A - Common Values**: Use the same expected values for all labels (e.g., same producer submitting multiple similar products)
   - **Option B - CSV Upload**: Upload a CSV file with individual expected values for each label
4. **Verify Batch**: Click the verification button to process all labels
5. **Review Results**:
   - See summary statistics (passed, failed, need review)
   - Expand individual labels for detailed results
   - Export results to CSV for record-keeping

#### CSV Template

Download the CSV template from the batch upload interface. The CSV should include these columns:

```csv
brandName,classType,alcoholContent,netContents,producerNameAddress,countryOfOrigin,beverageType,imageFileName
OLD TOM DISTILLERY,Kentucky Straight Bourbon Whiskey,45% Alc./Vol.,750 mL,"Old Tom Distillery, Louisville, KY",,spirits,label1.jpg
```

**Important**: The `imageFileName` column must match the actual filenames of your uploaded images.

## API Documentation

### POST `/api/verify`

Verifies a label image against expected values.

**Request Body:**

```typescript
{
  "image": "data:image/jpeg;base64,...", // Base64 encoded image with data URL prefix
  "expectedValues": {
    "brandName": "OLD TOM DISTILLERY",
    "classType": "Kentucky Straight Bourbon Whiskey",
    "alcoholContent": "45% Alc./Vol.",
    "netContents": "750 mL",
    "producerNameAddress": "Old Tom Distillery, Louisville, KY",
    "countryOfOrigin": "", // Optional, for imports only
    "beverageType": "spirits" // "wine" | "beer" | "spirits"
  }
}
```

**Response:**

```typescript
{
  "success": true,
  "processingTimeMs": 2847,
  "extractedValues": {
    "brandName": "OLD TOM DISTILLERY",
    "classType": "Kentucky Straight Bourbon Whiskey",
    // ... other extracted fields
  },
  "verificationResults": [
    {
      "fieldName": "Brand Name",
      "expected": "OLD TOM DISTILLERY",
      "extracted": "OLD TOM DISTILLERY",
      "status": "match", // "match" | "mismatch" | "not_found" | "partial_match"
      "details": "Optional explanation"
    },
    // ... results for other fields
  ],
  "overallStatus": "pass" // "pass" | "fail" | "review_needed"
}
```

### POST `/api/verify-batch`

Verifies multiple label images in a single request.

**Request Body:**

```typescript
{
  "labels": [
    {
      "imageId": "label1.jpg",
      "image": "data:image/jpeg;base64,...",
      "expectedValues": {
        "brandName": "OLD TOM DISTILLERY",
        "classType": "Kentucky Straight Bourbon Whiskey",
        "alcoholContent": "45% Alc./Vol.",
        "netContents": "750 mL",
        "producerNameAddress": "Old Tom Distillery, Louisville, KY",
        "countryOfOrigin": "",
        "beverageType": "spirits"
      }
    },
    // ... more labels
  ]
}
```

**Response:**

```typescript
{
  "totalLabels": 10,
  "passed": 7,
  "failed": 2,
  "reviewNeeded": 1,
  "results": [
    {
      "imageId": "label1.jpg",
      "result": {
        // Same structure as single verify response
      }
    },
    // ... results for other labels
  ],
  "totalProcessingTimeMs": 28470
}
```

## Project Structure

```
alcohol-label-verifier/
├── app/
│   ├── api/
│   │   ├── verify/
│   │   │   └── route.ts          # Single label verification endpoint
│   │   └── verify-batch/
│   │       └── route.ts          # Batch verification endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main application page (with mode toggle)
│   └── globals.css               # Global styles
├── components/
│   ├── ApplicationDataForm.tsx   # Form for expected values
│   ├── BatchResults.tsx          # Batch results display with expandable details
│   ├── BatchUploader.tsx         # Batch image upload with CSV support
│   ├── LabelUploader.tsx         # Single image upload component
│   ├── LoadingSpinner.tsx        # Loading state indicator
│   ├── VerificationResults.tsx   # Single label results display
│   └── WarningReference.tsx      # Government warning reference
├── lib/
│   ├── comparison.ts             # Field comparison logic
│   ├── constants.ts              # Constants and prompts
│   ├── csv-utils.ts              # CSV parsing and export utilities
│   ├── gemini.ts                 # Gemini API client
│   └── types.ts                  # TypeScript type definitions
├── public/                       # Static assets
├── .env.local.example           # Environment variable template
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

## Known Limitations

This is a prototype tool with the following limitations:

1. **No Bold Detection**: Cannot detect if text is bold in the image (required for "GOVERNMENT WARNING:")
2. **No Spatial Validation**: Cannot verify if warning is "separate and apart" from other text
3. **Image Quality Dependent**: Accuracy depends on image quality, lighting, and angle
4. **Not Integrated with COLA**: Standalone tool, not connected to the TTB COLA system
5. **No Authentication**: No user accounts or login system (prototype scope)
6. **No Data Persistence**: Results are not saved or stored anywhere (except CSV export)
7. **No Conditional Logic**: Doesn't handle field requirements that vary by beverage type
8. **Sequential Processing**: Batch mode processes labels one at a time (not parallel) to avoid API rate limits

## Comparison Logic

### Field-Specific Matching

For TTB compliance, all comparisons use strict exact matching with minimal normalization:

- **Brand Name, Class/Type, Producer, Country of Origin**: Exact match required after normalization
  - Case-insensitive comparison
  - Whitespace normalized
  - Basic punctuation removed (periods, commas, hyphens)
  - No typo tolerance
- **Alcohol Content**: Exact percentage match required
  - Normalizes formats (ABV, Alc./Vol.) but percentage must match exactly
  - No tolerance for rounding differences
- **Net Contents**: Exact value and unit match required
  - Normalizes units (mL, FL OZ) and spacing
- **Government Warning**: Exact match required
  - "GOVERNMENT WARNING:" must be all caps
  - Accepts both standard capitalization and all-caps version
  - Word-for-word match including punctuation

### Status Types

- ✅ **MATCH**: Values match exactly after normalization
- ❌ **MISMATCH**: Values do not match
- ⚠️ **NOT FOUND**: Field not visible or legible on label

## Troubleshooting

### "GOOGLE_AI_API_KEY environment variable is not set"

Make sure you've created a `.env.local` file with your API key:

```env
GOOGLE_AI_API_KEY=your_key_here
```

Restart the development server after adding environment variables.

### "Failed to extract label data"

- Check that your image is clear and well-lit
- Ensure the image is in JPG, PNG, or WEBP format
- Try reducing the image file size if it's larger than 10MB
- Verify your Google AI API key is valid and has quota remaining

### Slow Processing Times

- The app targets <5 second processing times
- Larger images may take longer to process
- Try reducing image resolution while maintaining readability
- Check your internet connection speed

## Development

### Build for Production

```bash
npm run build
```

### Run Production Build Locally

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Contributing

This is a prototype tool. For improvements or bug reports, please contact the development team.

## License

Internal tool for TTB compliance agents.

## Support

For questions or issues, please refer to the PRD or contact the project maintainer.

---

**Note**: This is a prototype tool designed to assist TTB compliance agents. It is not intended to replace human judgment in label verification decisions.
