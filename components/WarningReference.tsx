'use client';

import { useState } from 'react';
import { GOVERNMENT_WARNING_TEXT } from '@/lib/constants';

export default function WarningReference() {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(GOVERNMENT_WARNING_TEXT);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Required Government Warning Text (27 CFR Part 16)
        </h3>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded p-3">
        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono leading-relaxed">
          {GOVERNMENT_WARNING_TEXT}
        </pre>
      </div>

      <div className="mt-3 text-xs text-gray-600 space-y-1">
        <p className="font-medium">Requirements:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>&quot;GOVERNMENT WARNING:&quot; must be in capital letters and bold type</li>
          <li>&quot;Surgeon&quot; and &quot;General&quot; must be capitalized</li>
          <li>Must appear as one contiguous statement</li>
          <li>Must be separate and apart from other information</li>
        </ul>
      </div>
    </div>
  );
}
