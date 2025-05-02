import { useRef, useState } from 'react';

import { Autocomplete } from '@react-google-maps/api';
import { MapPin, Loader2, X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SearchBoxProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export function SearchBox({ onPlaceSelect }: SearchBoxProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    
    // Configure Autocomplete for regions in USA
    autocomplete.setOptions({
      types: ['(regions)'],
      componentRestrictions: { country: 'us' },
      fields: ['geometry', 'formatted_address', 'place_id', 'name']
    });
  };

  const onPlaceChanged = () => {
    setIsLoading(true);
    const place = autocompleteRef.current?.getPlace();
    
    if (place?.geometry) {
      onPlaceSelect(place);
      if (place.formatted_address) {
        setSearchValue(place.formatted_address);
      }
    }
    setIsLoading(false);
  };

  const handleClear = () => {
    setSearchValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <MapPin className="h-5 w-5 text-gray-400" />
      </div>
      
      <Autocomplete
        onLoad={onLoad}
        onPlaceChanged={onPlaceChanged}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Set the map search area (state, city, or region)"
          className={cn(
            "w-full pl-10 pr-12 py-3 rounded-lg shadow-lg border border-gray-300",
            "focus:outline-none focus:ring-2 focus:ring-blue-500",
            "text-base placeholder-gray-400 bg-white/95",
            "transition-colors duration-200"
          )}
          onChange={(e) => setSearchValue(e.target.value)}
          value={searchValue}
        />
      </Autocomplete>

      <div className="absolute inset-y-0 right-3 flex items-center">
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        ) : searchValue ? (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Search suggestions loading indicator */}
      {isLoading && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm text-gray-600">Finding location...</span>
          </div>
        </div>
      )}
    </div>
  );
} 