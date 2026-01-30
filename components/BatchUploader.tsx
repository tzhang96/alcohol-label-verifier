'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_IMAGE_FORMATS } from '@/lib/constants';
import { parseCSV, generateCSVTemplate, downloadCSV } from '@/lib/csv-utils';
import type { ExpectedValues } from '@/lib/types';

interface BatchImage {
  id: string;
  file: File;
  dataUrl: string;
  expectedValues?: ExpectedValues;
}

interface BatchUploaderProps {
  onBatchReady: (images: BatchImage[], commonValues?: ExpectedValues) => void;
  disabled?: boolean;
}

export default function BatchUploader({ onBatchReady, disabled = false }: BatchUploaderProps) {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [useCommonValues, setUseCommonValues] = useState(true);
  const [commonValues, setCommonValues] = useState<ExpectedValues>({
    brandName: '',
    classType: '',
    alcoholContent: '',
    netContents: '',
    producerNameAddress: '',
    countryOfOrigin: '',
    beverageType: 'spirits',
  });
  const [error, setError] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Maximum dimensions to keep payload under Vercel limit
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1920;

          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression (0.85 quality for JPEG)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImagesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    const newImages: BatchImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      if (!ACCEPTED_IMAGE_FORMATS.includes(file.type)) {
        setError(`File ${file.name} is not a supported image format`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File ${file.name} exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB size limit`);
        continue;
      }

      try {
        // Resize image to keep payload small
        const dataUrl = await resizeImage(file);

        newImages.push({
          id: `${Date.now()}-${i}`,
          file,
          dataUrl,
        });
      } catch (err) {
        setError(`Failed to process ${file.name}`);
        console.error('Image processing error:', err);
      }
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleCSVUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);

      // Match CSV data with uploaded images by filename
      setImages((prevImages) =>
        prevImages.map((img) => {
          const matchingData = parsedData.find(
            (data) => data.imageFileName === img.file.name
          );
          if (matchingData) {
            const { imageFileName, ...expectedValues } = matchingData;
            return { ...img, expectedValues };
          }
          return img;
        })
      );

      setUseCommonValues(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    downloadCSV(template, 'batch-upload-template.csv');
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSubmit = () => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    if (useCommonValues) {
      // Validate common values
      if (
        !commonValues.brandName ||
        !commonValues.classType ||
        !commonValues.alcoholContent ||
        !commonValues.netContents ||
        !commonValues.producerNameAddress
      ) {
        setError('Please fill in all required common fields');
        return;
      }
      onBatchReady(images, commonValues);
    } else {
      // Check if all images have expected values
      const missingValues = images.filter((img) => !img.expectedValues);
      if (missingValues.length > 0) {
        setError(`${missingValues.length} image(s) missing expected values from CSV`);
        return;
      }
      onBatchReady(images);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Batch Upload</h2>
        <button
          onClick={handleDownloadTemplate}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Download CSV Template
        </button>
      </div>

      {/* Upload Images */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="space-y-4">
          <div className="text-gray-400">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={disabled}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Select Multiple Images
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Select multiple label images (JPG, PNG, WEBP)
            </p>
          </div>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(e) => handleImagesSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Uploaded Images Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Uploaded Images ({images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
            {images.map((img) => (
              <div key={img.id} className="relative border rounded-lg overflow-hidden group">
                <img src={img.dataUrl} alt={img.file.name} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveImage(img.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
                <div className="p-1 bg-white">
                  <p className="text-xs text-gray-600 truncate" title={img.file.name}>
                    {img.file.name}
                  </p>
                  {img.expectedValues && (
                    <p className="text-xs text-green-600">✓ Has data</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode Selection */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Expected Values</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={useCommonValues}
                onChange={() => setUseCommonValues(true)}
                className="w-4 h-4"
                disabled={disabled}
              />
              <span className="text-sm">Use common values for all images</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                checked={!useCommonValues}
                onChange={() => setUseCommonValues(false)}
                className="w-4 h-4"
                disabled={disabled}
              />
              <span className="text-sm">Upload CSV with individual values</span>
            </label>
          </div>

          {useCommonValues ? (
            <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
              <input
                type="text"
                placeholder="Brand Name *"
                value={commonValues.brandName}
                onChange={(e) =>
                  setCommonValues({ ...commonValues, brandName: e.target.value })
                }
                disabled={disabled}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Class/Type *"
                value={commonValues.classType}
                onChange={(e) =>
                  setCommonValues({ ...commonValues, classType: e.target.value })
                }
                disabled={disabled}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Alcohol Content *"
                value={commonValues.alcoholContent}
                onChange={(e) =>
                  setCommonValues({ ...commonValues, alcoholContent: e.target.value })
                }
                disabled={disabled}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <input
                type="text"
                placeholder="Net Contents *"
                value={commonValues.netContents}
                onChange={(e) =>
                  setCommonValues({ ...commonValues, netContents: e.target.value })
                }
                disabled={disabled}
                className="w-full px-3 py-2 border rounded text-sm"
              />
              <textarea
                placeholder="Producer Name & Address *"
                value={commonValues.producerNameAddress}
                onChange={(e) =>
                  setCommonValues({ ...commonValues, producerNameAddress: e.target.value })
                }
                disabled={disabled}
                rows={2}
                className="w-full px-3 py-2 border rounded text-sm resize-none"
              />
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-lg p-4 text-center">
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                disabled={disabled}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              >
                Upload CSV File
              </button>
              <p className="text-xs text-gray-600 mt-2">
                CSV must include columns matching image filenames
              </p>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={handleSubmit}
          disabled={disabled || images.length === 0}
          className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Verify {images.length} Label{images.length !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
