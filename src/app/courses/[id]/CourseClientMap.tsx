'use client'

import Image from 'next/image'

type CourseClientMapProps = {
  coordinates: {
    lat: number;
    lng: number;
  };
  name: string;
}

export default function CourseClientMap({ coordinates, name }: CourseClientMapProps): JSX.Element {
  // Ensure coordinates are valid numbers
  const validCoordinates = {
    lat: typeof coordinates?.lat === 'number' ? coordinates.lat : 39.8283,
    lng: typeof coordinates?.lng === 'number' ? coordinates.lng : -98.5795
  };
  
  // Get API key
  const mapApiKey = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'];
  
  // Handle case where API key might be missing (optional, but good practice)
  if (!mapApiKey) {
    console.error("Error: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set.");
    // Return a placeholder or message if the key is missing
    return (
       <div className="h-64 rounded-lg overflow-hidden relative bg-gray-200 flex items-center justify-center">
          <p className="text-gray-500 text-sm p-4 text-center">Map cannot be displayed (Configuration Error)</p>
       </div>
    );
  }
  
  // Create static map URL - Zoom 10, size 640x400, scale=2, maptype=hybrid
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${validCoordinates.lat},${validCoordinates.lng}&zoom=10&size=640x400&scale=2&maptype=hybrid&markers=color:red%7C${validCoordinates.lat},${validCoordinates.lng}&key=${mapApiKey}`;
  
  // Create a Google Maps link for when users click on the image
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${validCoordinates.lat},${validCoordinates.lng}`;
  
  // Updated wrapper div height to match potential image aspect ratio better if needed, or rely on parent
  // Removed fixed height h-64, let parent container control height primarily
  return (
    <div className="w-full h-full relative shadow-md"> {/* Removed h-64 */} 
      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open location of ${name} in Google Maps`} className="block w-full h-full">
        <Image 
          src={mapUrl}
          alt={`Map showing location of ${name}`}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        {/* REMOVED Internal Map Overlay with course name and icon */}
        {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3 text-white">
          <div className="flex items-center">
            <svg ...>
              ...
            </svg>
            <span className="font-medium text-sm truncate">{name}</span>
          </div>
        </div> */}
      </a>
    </div>
  );
}