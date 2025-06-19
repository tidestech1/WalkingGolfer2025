import React, { useState } from 'react';

import { Navigation } from 'lucide-react';

interface LocationPromptProps {
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  onSkip: () => void;
}

export function LocationPrompt({ onLocationSelect, onSkip }: LocationPromptProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationRequest = (): void => {
    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        onLocationSelect({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Please enable location access in your browser settings to use this feature");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Unable to determine your location");
            break;
          case err.TIMEOUT:
            setError("Location request timed out");
            break;
          default:
            setError("An error occurred while getting your location");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="location-prompt tour-target absolute bottom-20 lg:bottom-24 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-[400px] bg-white rounded-lg shadow-lg p-4 border border-gray-200">
      <div className="flex items-start space-x-4">
        <div className="bg-blue-50 rounded-full p-2">
          <Navigation className="w-6 h-6 text-blue-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">Find Nearby Courses</h3>
          <p className="text-sm text-gray-600 mb-3">
            Allow location access to discover walkable golf courses near you
          </p>
          
          {error && (
            <div className="text-sm text-red-500 mb-3">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleLocationRequest}
              disabled={isLoading}
              className="use-location-btn flex-1 bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Use My Location"
              )}
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium 
                       hover:bg-gray-100 border border-gray-200"
            >
              Search Instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 