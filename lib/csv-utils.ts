import type { ExpectedValues, VerifyResponse } from './types';

/**
 * Parse CSV content into an array of expected values
 * Expected CSV format:
 * brandName,classType,alcoholContent,netContents,producerNameAddress,countryOfOrigin,beverageType,imageFileName
 */
export function parseCSV(csvContent: string): Array<ExpectedValues & { imageFileName: string }> {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const results: Array<ExpectedValues & { imageFileName: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());

    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has mismatched column count, skipping`);
      continue;
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    results.push({
      brandName: row.brandName || '',
      classType: row.classType || '',
      alcoholContent: row.alcoholContent || '',
      netContents: row.netContents || '',
      producerNameAddress: row.producerNameAddress || '',
      countryOfOrigin: row.countryOfOrigin || undefined,
      beverageType: (row.beverageType as 'wine' | 'beer' | 'spirits') || 'spirits',
      imageFileName: row.imageFileName || '',
    });
  }

  return results;
}

/**
 * Export verification results to CSV format
 */
export function exportResultsToCSV(results: Array<{ fileName: string; result: VerifyResponse }>): string {
  const headers = [
    'Image File',
    'Overall Status',
    'Processing Time (ms)',
    'Brand Name Status',
    'Class/Type Status',
    'Alcohol Content Status',
    'Net Contents Status',
    'Producer Status',
    'Country of Origin Status',
    'Government Warning Status',
    'Issues',
  ];

  const rows = results.map((item) => {
    const issues = item.result.verificationResults
      .filter((r) => r.status !== 'match')
      .map((r) => `${r.fieldName}: ${r.status}`)
      .join('; ');

    return [
      item.fileName,
      item.result.overallStatus,
      item.result.processingTimeMs.toString(),
      item.result.verificationResults.find((r) => r.fieldName === 'Brand Name')?.status || '',
      item.result.verificationResults.find((r) => r.fieldName === 'Class/Type')?.status || '',
      item.result.verificationResults.find((r) => r.fieldName === 'Alcohol Content')?.status || '',
      item.result.verificationResults.find((r) => r.fieldName === 'Net Contents')?.status || '',
      item.result.verificationResults.find((r) => r.fieldName === 'Producer Name & Address')?.status || '',
      item.result.verificationResults.find((r) => r.fieldName === 'Country of Origin')?.status || '',
      item.result.verificationResults.find((r) => r.fieldName === 'Government Warning')?.status || '',
      issues,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return csvContent;
}

/**
 * Download CSV content as a file
 */
export function downloadCSV(csvContent: string, fileName: string = 'verification-results.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate CSV template for batch upload
 */
export function generateCSVTemplate(): string {
  const headers = [
    'brandName',
    'classType',
    'alcoholContent',
    'netContents',
    'producerNameAddress',
    'countryOfOrigin',
    'beverageType',
    'imageFileName',
  ];

  const exampleRow = [
    'OLD TOM DISTILLERY',
    'Kentucky Straight Bourbon Whiskey',
    '45% Alc./Vol.',
    '750 mL',
    'Old Tom Distillery, Louisville, KY',
    '',
    'spirits',
    'label1.jpg',
  ];

  return [headers.join(','), exampleRow.join(',')].join('\n');
}
