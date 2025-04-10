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
  
  // Create static map URL
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${validCoordinates.lat},${validCoordinates.lng}&zoom=14&size=600x400&maptype=roadmap&markers=color:red%7C${validCoordinates.lat},${validCoordinates.lng}&key=${mapApiKey}`;
  
  // Create a Google Maps link for when users click on the image
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${validCoordinates.lat},${validCoordinates.lng}`;
  
  return (
    <div className="h-64 rounded-lg overflow-hidden relative shadow-md">
      <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open location of ${name} in Google Maps`} className="block w-full h-full">
        <Image 
          src={mapUrl}
          alt={`Map showing location of ${name}`}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        {/* Overlay with course name and icon */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3 text-white">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium text-sm truncate">{name}</span>
          </div>
        </div>
      </a>
    </div>
  );
}