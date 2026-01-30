'use client';

import { useState } from 'react';
import VerificationResults from './VerificationResults';
import { exportResultsToCSV, downloadCSV } from '@/lib/csv-utils';
import type { VerifyResponse } from '@/lib/types';

interface BatchResult {
  fileName: string;
  imageDataUrl: string;
  result: VerifyResponse;
}

interface BatchResultsProps {
  results: BatchResult[];
  onClear: () => void;
}

export default function BatchResults({ results, onClear }: BatchResultsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const passedCount = results.filter((r) => r.result.overallStatus === 'pass').length;
  const failedCount = results.filter((r) => r.result.overallStatus === 'fail').length;
  const reviewCount = results.filter((r) => r.result.overallStatus === 'review_needed').length;
  const totalCount = results.length;

  const handleExportCSV = () => {
    const csvContent = exportResultsToCSV(results);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    downloadCSV(csvContent, `batch-verification-results-${timestamp}.csv`);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'fail':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'review_needed':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'review_needed':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Batch Verification Summary</h2>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-3xl font-bold text-blue-900">{totalCount}</div>
            <div className="text-sm text-blue-700 mt-1">Total Labels</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-3xl font-bold text-green-900">{passedCount}</div>
            <div className="text-sm text-green-700 mt-1">Passed</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-3xl font-bold text-red-900">{failedCount}</div>
            <div className="text-sm text-red-700 mt-1">Failed</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-3xl font-bold text-yellow-900">{reviewCount}</div>
            <div className="text-sm text-yellow-700 mt-1">Need Review</div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={handleExportCSV}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            📊 Export Results to CSV
          </button>
          <button
            onClick={onClear}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Clear & Start Over
          </button>
        </div>
      </div>

      {/* Individual Results */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Individual Label Results</h3>

        {results.map((item, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg overflow-hidden ${getStatusColor(
              item.result.overallStatus
            )}`}
          >
            {/* Summary Header - Clickable */}
            <button
              onClick={() => toggleExpand(index)}
              className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{getStatusIcon(item.result.overallStatus)}</span>
                <div className="text-left">
                  <div className="font-semibold text-lg">{item.fileName}</div>
                  <div className="text-sm opacity-75">
                    Status: {item.result.overallStatus.toUpperCase().replace('_', ' ')} •
                    Processing time: {item.result.processingTimeMs}ms
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {expandedIndex === index ? 'Hide Details' : 'Show Details'}
                </span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${
                    expandedIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expandable Details */}
            {expandedIndex === index && (
              <div className="border-t px-6 py-6 bg-white">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Image Preview */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Label Image</h4>
                    <img
                      src={item.imageDataUrl}
                      alt={item.fileName}
                      className="w-full border rounded-lg"
                    />
                  </div>

                  {/* Quick Stats */}
                  <div className="lg:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-2">Field Status Summary</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {item.result.verificationResults.map((field, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded border"
                        >
                          <span className="text-sm font-medium truncate">{field.fieldName}</span>
                          <span className="text-sm ml-2">
                            {field.status === 'match' && '✅'}
                            {field.status === 'mismatch' && '❌'}
                            {field.status === 'not_found' && '⚠️'}
                            {field.status === 'partial_match' && 'ℹ️'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Full Verification Results */}
                <div className="border-t pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">Detailed Verification Results</h4>
                  <VerificationResults results={item.result} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
