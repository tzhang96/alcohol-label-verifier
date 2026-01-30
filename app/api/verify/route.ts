import { NextRequest, NextResponse } from 'next/server';
import { extractLabelData, parseDataUrl } from '@/lib/gemini';
import { compareField } from '@/lib/comparison';
import { FIELD_DISPLAY_NAMES, GOVERNMENT_WARNING_TEXT } from '@/lib/constants';
import type {
  VerifyRequest,
  VerifyResponse,
  FieldVerificationResult,
  OverallStatus,
} from '@/lib/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: VerifyRequest = await request.json();

    // Validate request
    if (!body.image || !body.expectedValues) {
      return NextResponse.json(
        { error: 'Missing required fields: image or expectedValues' },
        { status: 400 }
      );
    }

    // Parse the data URL to get base64 and MIME type
    const { base64, mimeType } = parseDataUrl(body.image);

    // Extract label data using Gemini
    const extractedValues = await extractLabelData(base64, mimeType);

    // Compare each field
    const verificationResults: FieldVerificationResult[] = [];

    // Brand Name
    const brandNameResult = compareField(
      'brandName',
      body.expectedValues.brandName,
      extractedValues.brandName
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.brandName,
      expected: body.expectedValues.brandName,
      extracted: extractedValues.brandName,
      status: brandNameResult.status,
      details: brandNameResult.details,
    });

    // Class/Type
    const classTypeResult = compareField(
      'classType',
      body.expectedValues.classType,
      extractedValues.classType
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.classType,
      expected: body.expectedValues.classType,
      extracted: extractedValues.classType,
      status: classTypeResult.status,
      details: classTypeResult.details,
    });

    // Alcohol Content
    const alcoholContentResult = compareField(
      'alcoholContent',
      body.expectedValues.alcoholContent,
      extractedValues.alcoholContent
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.alcoholContent,
      expected: body.expectedValues.alcoholContent,
      extracted: extractedValues.alcoholContent,
      status: alcoholContentResult.status,
      details: alcoholContentResult.details,
    });

    // Net Contents
    const netContentsResult = compareField(
      'netContents',
      body.expectedValues.netContents,
      extractedValues.netContents
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.netContents,
      expected: body.expectedValues.netContents,
      extracted: extractedValues.netContents,
      status: netContentsResult.status,
      details: netContentsResult.details,
    });

    // Producer Name & Address
    const producerResult = compareField(
      'producerNameAddress',
      body.expectedValues.producerNameAddress,
      extractedValues.producerNameAddress
    );
    verificationResults.push({
      fieldName: FIELD_DISPLAY_NAMES.producerNameAddress,
      expected: body.expectedValues.producerNameAddress,
      extracted: extractedValues.producerNameAddress,
      status: producerResult.status,
      details: producerResult.details,
    });

    // Country of Origin (optional)
    if (body.expectedValues.countryOfOrigin && body.expectedValues.countryOfOrigin.trim()) {
      const countryResult = compareField(
        'countryOfOrigin',
        body.expectedValues.countryOfOrigin,
        extractedValues.countryOfOrigin
      );
      verificationResults.push({
        fieldName: FIELD_DISPLAY_NAMES.countryOfOrigin,
        expected: body.expectedValues.countryOfOrigin,
        extracted: extractedValues.countryOfOrigin,
        status: countryResult.status,
        details: countryResult.details,
      });
    }

    // Government Warning (always checked)
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
    const hasMatch = verificationResults.some((r) => r.status === 'match');
    const hasMismatch = verificationResults.some((r) => r.status === 'mismatch');
    const hasNotFound = verificationResults.some((r) => r.status === 'not_found');
    const hasPartialMatch = verificationResults.some((r) => r.status === 'partial_match');

    if (hasMismatch || hasNotFound) {
      overallStatus = 'fail';
    } else if (hasPartialMatch) {
      overallStatus = 'review_needed';
    }

    const processingTimeMs = Date.now() - startTime;

    const response: VerifyResponse = {
      success: true,
      processingTimeMs,
      extractedValues,
      verificationResults,
      overallStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Verification error:', error);

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTimeMs,
      },
      { status: 500 }
    );
  }
}
