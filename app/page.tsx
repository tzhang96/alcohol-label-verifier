'use client';

import { useState } from 'react';
import LabelUploader from '@/components/LabelUploader';
import ApplicationDataForm from '@/components/ApplicationDataForm';
import VerificationResults from '@/components/VerificationResults';
import LoadingSpinner from '@/components/LoadingSpinner';
import WarningReference from '@/components/WarningReference';
import BatchUploader from '@/components/BatchUploader';
import BatchResults from '@/components/BatchResults';
import type { ExpectedValues, VerifyResponse } from '@/lib/types';

type Mode = 'single' | 'batch';

interface BatchImage {
  id: string;
  file: File;
  dataUrl: string;
  expectedValues?: ExpectedValues;
}

interface BatchResult {
  fileName: string;
  imageDataUrl: string;
  result: VerifyResponse;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('single');
  const [expectedValues, setExpectedValues] = useState<ExpectedValues>({
    brandName: '',
    classType: '',
    alcoholContent: '',
    netContents: '',
    producerNameAddress: '',
    countryOfOrigin: '',
    beverageType: 'spirits',
  });

  // Single mode state
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerifyResponse | null>(null);

  // Batch mode state
  const [batchResults, setBatchResults] = useState<BatchResult[] | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!imageDataUrl) {
      setError('Please upload a label image');
      return;
    }

    // Validate required fields
    if (
      !expectedValues.brandName ||
      !expectedValues.classType ||
      !expectedValues.alcoholContent ||
      !expectedValues.netContents ||
      !expectedValues.producerNameAddress
    ) {
      setError('Please fill in all required fields');
      return;
    }

    setError(null);
    setIsVerifying(true);
    setVerificationResults(null);

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageDataUrl,
          expectedValues,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setVerificationResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBatchVerify = async (images: BatchImage[], commonValues?: ExpectedValues) => {
    setError(null);
    setIsVerifying(true);
    setBatchResults(null);

    try {
      const labels = images.map((img) => ({
        imageId: img.file.name,
        image: img.dataUrl,
        expectedValues: img.expectedValues || commonValues!,
      }));

      const response = await fetch('/api/verify-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ labels }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Batch verification failed');
      }

      // Transform results to include image data
      const results: BatchResult[] = data.results.map((item: any) => {
        const img = images.find((i) => i.file.name === item.imageId);
        return {
          fileName: item.imageId,
          imageDataUrl: img?.dataUrl || '',
          result: item.result,
        };
      });

      setBatchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during batch verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearAndStartOver = () => {
    setExpectedValues({
      brandName: '',
      classType: '',
      alcoholContent: '',
      netContents: '',
      producerNameAddress: '',
      countryOfOrigin: '',
      beverageType: 'spirits',
    });
    setImageDataUrl(null);
    setVerificationResults(null);
    setBatchResults(null);
    setError(null);
  };

  const handleModeSwitch = (newMode: Mode) => {
    handleClearAndStartOver();
    setMode(newMode);
  };

  const isFormValid =
    imageDataUrl &&
    expectedValues.brandName &&
    expectedValues.classType &&
    expectedValues.alcoholContent &&
    expectedValues.netContents &&
    expectedValues.producerNameAddress;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3 text-3xl">🏛️</span>
              Alcohol Label Verification Tool
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleModeSwitch('single')}
                disabled={isVerifying}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Single Label
              </button>
              <button
                onClick={() => handleModeSwitch('batch')}
                disabled={isVerifying}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  mode === 'batch'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Batch Upload
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'single' ? (
          <>
            {/* Single Label Mode */}
            {/* Input Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column - Image Upload */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <LabelUploader onImageSelect={setImageDataUrl} disabled={isVerifying} />
              </div>

              {/* Right Column - Application Data Form */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <ApplicationDataForm
                  values={expectedValues}
                  onChange={setExpectedValues}
                  disabled={isVerifying}
                />
              </div>
            </div>

            {/* Government Warning Reference */}
            <div className="mb-8">
              <WarningReference />
            </div>

            {/* Verify Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={handleVerify}
                disabled={!isFormValid || isVerifying}
                className="px-12 py-4 bg-blue-600 text-white text-xl font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
              >
                {isVerifying ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center">🔍 VERIFY LABEL</span>
                )}
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isVerifying && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <LoadingSpinner />
              </div>
            )}

            {/* Results Section */}
            {verificationResults && !isVerifying && (
              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <VerificationResults results={verificationResults} />
                </div>

                {/* Clear & Start Over Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleClearAndStartOver}
                    className="px-8 py-3 bg-gray-600 text-white text-lg font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear & Start Over
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Batch Mode */}
            {!batchResults ? (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <BatchUploader onBatchReady={handleBatchVerify} disabled={isVerifying} />
              </div>
            ) : null}

            {/* Error Message */}
            {error && (
              <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <span className="text-red-500 text-xl mr-3">⚠️</span>
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isVerifying && (
              <div className="bg-white rounded-lg shadow-sm p-8">
                <LoadingSpinner message="Processing batch verification..." />
              </div>
            )}

            {/* Batch Results */}
            {batchResults && !isVerifying && (
              <BatchResults results={batchResults} onClear={handleClearAndStartOver} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            AI-Powered Label Verification Tool for TTB Compliance Agents
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            Prototype - Not integrated with COLA system
          </p>
        </div>
      </footer>
    </div>
  );
}
