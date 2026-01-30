'use client';

import type { VerifyResponse } from '@/lib/types';

interface VerificationResultsProps {
  results: VerifyResponse;
}

export default function VerificationResults({ results }: VerificationResultsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'match':
        return '✅';
      case 'mismatch':
        return '❌';
      case 'not_found':
        return '⚠️';
      case 'partial_match':
        return 'ℹ️';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'match':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'mismatch':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'not_found':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'partial_match':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusDisplay = () => {
    switch (results.overallStatus) {
      case 'pass':
        return {
          text: 'ALL CHECKS PASSED',
          color: 'bg-green-600',
          icon: '✓',
        };
      case 'fail':
        return {
          text: 'VERIFICATION FAILED',
          color: 'bg-red-600',
          icon: '✗',
        };
      case 'review_needed':
        return {
          text: 'REVIEW NEEDED',
          color: 'bg-yellow-600',
          icon: '!',
        };
      default:
        return {
          text: 'UNKNOWN STATUS',
          color: 'bg-gray-600',
          icon: '?',
        };
    }
  };

  const overallStatus = getOverallStatusDisplay();

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <div className={`${overallStatus.color} text-white px-6 py-4 rounded-lg text-center`}>
        <div className="flex items-center justify-center space-x-3">
          <span className="text-2xl font-bold">{overallStatus.icon}</span>
          <h2 className="text-xl font-bold">{overallStatus.text}</h2>
        </div>
        <p className="mt-2 text-sm">
          Processing time: {results.processingTimeMs}ms
        </p>
      </div>

      {/* Field-by-Field Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Field Verification Results</h3>

        {results.verificationResults.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl flex-shrink-0">{getStatusIcon(result.status)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1">
                  <h4 className="font-semibold text-base">{result.fieldName}</h4>
                  <span className="text-xs uppercase font-medium ml-2">
                    {result.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Expected:</span>{' '}
                    <span className="break-words">{result.expected || '(not provided)'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Found:</span>{' '}
                    <span className="break-words">
                      {result.extracted || '(not found on label)'}
                    </span>
                  </div>
                </div>

                {result.details && (
                  <div className="mt-2 text-sm font-medium border-t pt-2 border-current/20">
                    {result.details}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Government Warning Check */}
      {results.extractedValues.governmentWarning && (
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Government Warning (Full Text)
          </h3>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
              {results.extractedValues.governmentWarning}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
