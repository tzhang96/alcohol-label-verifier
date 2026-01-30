import { NextRequest, NextResponse } from 'next/server';
import { extractLabelData, parseDataUrl } from '@/lib/gemini';
import { compareField } from '@/lib/comparison';
import { FIELD_DISPLAY_NAMES, GOVERNMENT_WARNING_TEXT } from '@/lib/constants';
import type {
  ExpectedValues,
  VerifyResponse,
  FieldVerificationResult,
  OverallStatus,
  ExtractedValues,
} from '@/lib/types';

interface BatchVerifyRequestItem {
  imageId: string;
  image: string; // Base64
  expectedValues: ExpectedValues;
}

interface BatchVerifyRequest {
  labels: BatchVerifyRequestItem[];
}

interface BatchVerifyResponse {
  totalLabels: number;
  passed: number;
  failed: number;
  reviewNeeded: number;
  results: Array<{
    imageId: string;
    result: VerifyResponse;
  }>;
  totalProcessingTimeMs: number;
}

async function verifyLabel(
  image: string,
  expectedValues: ExpectedValues
): Promise<VerifyResponse> {
  const startTime = Date.now();

  try {
    // Parse the data URL
    const { base64, mimeType } = parseDataUrl(image);

    // Extract label data
    const extractedValues: ExtractedValues = await extractLabelData(base64, mimeType);

    // Compare fields
    const verificationResults: FieldVerificationResult[] = [];

    // Brand Name
    const brandNameResult = compareField(
      'brandName',
      expectedValues.brandName,
      extractedValues.brandName
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.brandName,
      expected: expectedValues.brandName,
      extracted: extractedValues.brandName,
      status: brandNameResult.status,
      details: brandNameResult.details,
    });

    // Class/Type
    const classTypeResult = compareField(
      'classType',
      expectedValues.classType,
      extractedValues.classType
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.classType,
      expected: expectedValues.classType,
      extracted: extractedValues.classType,
      status: classTypeResult.status,
      details: classTypeResult.details,
    });

    // Alcohol Content
    const alcoholContentResult = compareField(
      'alcoholContent',
      expectedValues.alcoholContent,
      extractedValues.alcoholContent
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.alcoholContent,
      expected: expectedValues.alcoholContent,
      extracted: extractedValues.alcoholContent,
      status: alcoholContentResult.status,
      details: alcoholContentResult.details,
    });

    // Net Contents
    const netContentsResult = compareField(
      'netContents',
      expectedValues.netContents,
      extractedValues.netContents
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.netContents,
      expected: expectedValues.netContents,
      extracted: extractedValues.netContents,
      status: netContentsResult.status,
      details: netContentsResult.details,
    });

    // Producer Name & Address
    const producerResult = compareField(
      'producerNameAddress',
      expectedValues.producerNameAddress,
      extractedValues.producerNameAddress
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.producerNameAddress,
      expected: expectedValues.producerNameAddress,
      extracted: extractedValues.producerNameAddress,
      status: producerResult.status,
      details: producerResult.details,
    });

    // Country of Origin (optional)
    if (expectedValues.countryOfOrigin && expectedValues.countryOfOrigin.trim()) {
      const countryResult = compareField(
        'countryOfOrigin',
        expectedValues.countryOfOrigin,
        extractedValues.countryOfOrigin
      );
      verificationResults.push({
        fieldName: FIELD_DISPLAY_NAMES.countryOfOrigin,
        expected: expectedValues.countryOfOrigin,
        extracted: extractedValues.countryOfOrigin,
        status: countryResult.status,
        details: countryResult.details,
      });
    }

    // Government Warning
    const warningResult = compareField(
      'governmentWarning',
      GOVERNMENT_WARNING_TEXT,
      extractedValues.governmentWarning
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.governmentWarning,
      expected: GOVERNMENT_WARNING_TEXT,
      extracted: extractedValues.governmentWarning,
      status: warningResult.status,
      details: warningResult.details,
    });

    // Determine overall status
    let overallStatus: OverallStatus = 'pass';
    const hasMismatch = verificationResults.some((r) => r.status === 'mismatch');
    const hasNotFound = verificationResults.some((r) => r.status === 'not_found');
    const hasPartialMatch = verificationResults.some((r) => r.status === 'partial_match');

    if (hasMismatch || hasNotFound) {
      overallStatus = 'fail';
    } else if (hasPartialMatch) {
      overallStatus = 'review_needed';
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      success: true,
      processingTimeMs,
      extractedValues,
      verificationResults,
      overallStatus,
    };
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    throw new Error(
      `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function POST(request: NextRequest) {
  const batchStartTime = Date.now();

  try {
    const body: BatchVerifyRequest = await request.json();

    if (!body.labels || !Array.isArray(body.labels) || body.labels.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid labels array' },
        { status: 400 }
      );
    }

    // Process all labels
    const results = [];
    let passed = 0;
    let failed = 0;
    let reviewNeeded = 0;

    for (const label of body.labels) {
      try {
        const result = await verifyLabel(label.image, label.expectedValues);

        results.push({
          imageId: label.imageId,
          result,
        });

        // Count by status
        if (result.overallStatus === 'pass') passed++;
        else if (result.overallStatus === 'fail') failed++;
        else if (result.overallStatus === 'review_needed') reviewNeeded++;
      } catch (error) {
        // If one label fails, create an error result
        results.push({
          imageId: label.imageId,
          result: {
            success: false,
            processingTimeMs: 0,
            extractedValues: {
              brandName: null,
              classType: null,
              alcoholContent: null,
              netContents: null,
              producerNameAddress: null,
              countryOfOrigin: null,
              governmentWarning: null,
            },
            verificationResults: [],
            overallStatus: 'fail' as OverallStatus,
          },
        });
        failed++;
      }
    }

    const totalProcessingTimeMs = Date.now() - batchStartTime;

    const response: BatchVerifyResponse = {
      totalLabels: body.labels.length,
      passed,
      failed,
      reviewNeeded,
      results,
      totalProcessingTimeMs,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Batch verification error:', error);

    const totalProcessingTimeMs = Date.now() - batchStartTime;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalProcessingTimeMs,
      },
      { status: 500 }
    );
  }
}
