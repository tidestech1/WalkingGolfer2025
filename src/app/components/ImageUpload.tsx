import { useState, useRef } from 'react';

import { X, ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  initialImage?: string;
  onImageChange: (file: File | null) => void;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  maxSizeMB?: number;
}

export default function ImageUpload({ 
  initialImage, 
  onImageChange,
  aspectRatio = 'landscape',
  maxSizeMB = 2
}: ImageUploadProps): JSX.Element {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    setError(null);
    
    if (!file) {
      return;
    }
    
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }
    
    // Process valid image
    onImageChange(file);
    const reader = new FileReader();
    reader.onloadend = (): void => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (): void => {
    onImageChange(null);
    setImagePreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Style based on aspect ratio
  const getHeightClass = (): string => {
    switch (aspectRatio) {
      case 'square': return 'h-64 w-64'; 
      case 'portrait': return 'h-80 w-60';
      case 'landscape': 
      default: return 'w-full h-56';
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-2 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {imagePreview ? (
        <div className={`relative ${getHeightClass()}`}>
          <Image
            src={imagePreview}
            alt="Preview"
            fill
            className="rounded-lg object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            aria-label="Remove image"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <label
          htmlFor="image-upload"
          className={`flex flex-col items-center justify-center ${getHeightClass()} border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG or GIF (Max: {maxSizeMB}MB)
            </p>
          </div>
        </label>
      )}
      <input
        type="file"
        id="image-upload"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
        ref={fileInputRef}
      />
    </div>
  );
}
