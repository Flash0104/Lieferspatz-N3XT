'use client';

import { useState } from 'react';

interface ImageUploadProps {
  currentImage?: string;
  uploadType: 'profile' | 'restaurant' | 'menu';
  entityId?: string;
  onUploadSuccess?: (url: string) => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function ImageUpload({ 
  currentImage, 
  uploadType, 
  entityId, 
  onUploadSuccess,
  className = '',
  size = 'medium'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', uploadType);
      if (entityId) {
        formData.append('entityId', entityId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPreview(null);
        onUploadSuccess?.(data.url);
      } else {
        const errorData = await response.json();
        alert(`Upload failed: ${errorData.error}`);
        setPreview(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;

    setUploading(true);
    try {
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlInput,
          type: uploadType,
          entityId: entityId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUrlInput('');
        onUploadSuccess?.(data.url);
      } else {
        const errorData = await response.json();
        alert(`URL upload failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('URL upload error:', error);
      alert('URL upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getDefaultImage = () => {
    if (uploadType === 'restaurant') {
      return '/images/default-restaurant.svg';
    } else if (uploadType === 'profile') {
      return '/images/default-profile.svg';
    } else {
      return '/images/default-profile.svg';
    }
  };

  const displayImage = preview || currentImage || getDefaultImage();
  
  // Debug logging
  console.log('ImageUpload render:', {
    uploadType,
    currentImage,
    preview,
    displayImage,
    defaultImage: getDefaultImage()
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            uploadMode === 'file'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📁 Upload File
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            uploadMode === 'url'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🔗 From URL
        </button>
      </div>

      {/* Image Preview */}
      <div className={`relative group ${size === 'large' ? 'mx-auto w-fit' : ''}`}>
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100 relative`}>
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getDefaultImage();
            }}
          />
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            </div>
          )}

          {/* Upload overlay for file mode */}
          {uploadMode === 'file' && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Hidden file input for file mode */}
        {uploadMode === 'file' && (
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            disabled={uploading}
          />
        )}
      </div>

      {/* Upload Controls */}
      {uploadMode === 'file' ? (
        <div className="text-center">
          <label className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg cursor-pointer inline-block transition-colors">
            {uploading ? 'Uploading...' : 'Choose Image'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">Max file size: 5MB</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={uploading}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUrlUpload}
              disabled={uploading || !urlInput.trim()}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload from URL'}
            </button>
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="px-3 py-2 text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Paste a direct link to an image file (JPG, PNG, GIF, WebP)
          </p>
        </div>
      )}
    </div>
  );
} 