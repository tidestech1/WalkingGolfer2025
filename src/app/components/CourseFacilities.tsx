import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react'; // Icons for status

import { type GolfCourse } from '@/types/course';

interface CourseFacilitiesProps {
  course: GolfCourse;
}

// Helper component to render a single facility item
const FacilityItem: React.FC<{ label: string; status: boolean | null }> = ({ label, status }) => {
  let IconComponent: React.ElementType = HelpCircle;
  let iconColor = 'text-gray-400'; // Default for null/unknown
  let statusText = 'TBD';

  if (status === true) {
    IconComponent = Check;
    iconColor = 'text-green-600';
    statusText = 'Yes';
  } else if (status === false) {
    IconComponent = X;
    iconColor = 'text-red-600';
    statusText = 'No';
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center space-x-1">
        <IconComponent className={`w-4 h-4 ${iconColor}`} aria-hidden="true" />
        <span className={`text-xs font-medium ${
          status === true ? 'text-green-700' : status === false ? 'text-red-700' : 'text-gray-500'
        }`}>{statusText}</span>
      </div>
    </div>
  );
};

const CourseFacilities: React.FC<CourseFacilitiesProps> = ({ course }) => {
  // Define the facilities to display, potentially grouped
  const mainFacilities = [
    { label: 'Pro Shop', status: course.facilities_proShop },
    { label: 'Bar/Restaurant', status: course.facilities_barRestaurant },
    { label: 'Changing Room', status: course.facilities_changingRoom },
    { label: 'Lockers', status: course.facilities_lockers },
  ];

  const practiceFacilities = [
    { label: 'Driving Range', status: course.facilities_drivingRange },
    { label: 'Putting Green', status: course.facilities_puttingGreen },
    { label: 'Chipping Green', status: course.facilities_chippingGreen },
    { label: 'Practice Bunker', status: course.facilities_practiceBunker },
  ];

  const rentalFacilities = [
    { label: 'Caddies', status: course.facilities_caddies },
    { label: 'Club Rental', status: course.facilities_clubRental },
    { label: 'Golf Carts', status: course.facilities_golfCarts },
    { label: 'Push Carts', status: course.facilities_pushCarts },
  ];

  // Check if there's any facility data to show at all (optional, prevents empty card)
  const hasAnyFacilityData = [...mainFacilities, ...practiceFacilities, ...rentalFacilities].some(f => f.status !== undefined); // Check if fields exist

  // Can refine this check further if needed, e.g., only show if at least one is not null

  if (!hasAnyFacilityData) {
     // Optionally return null or a message if no facility data exists on the course object
     // return null; 
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-3 text-gray-800">Facilities</h2>
      
      {/* We can decide later whether to explicitly show categories or just list them */}
      {/* Option 1: Simple List */}
      {/* 
      <div className="space-y-1"> 
        {mainFacilities.map(f => <FacilityItem key={f.label} label={f.label} status={f.status} />)}
        {practiceFacilities.map(f => <FacilityItem key={f.label} label={f.label} status={f.status} />)}
        {rentalFacilities.map(f => <FacilityItem key={f.label} label={f.label} status={f.status} />)}
      </div>
      */}

      {/* Option 2: Grouped List (Example - uncomment and style if preferred) */}
       
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Main</h3>
          {mainFacilities.map(f => <FacilityItem key={f.label} label={f.label} status={f.status} />)}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Practice Areas</h3>
          {practiceFacilities.map(f => <FacilityItem key={f.label} label={f.label} status={f.status} />)}
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Rentals & Services</h3>
          {rentalFacilities.map(f => <FacilityItem key={f.label} label={f.label} status={f.status} />)}
        </div>
      </div> 
      
    </div>
  );
};

export default CourseFacilities; 