import { useEffect, useRef, useState } from 'react'

import { GoogleMap as GoogleMapComponent, LoadScript } from '@react-google-maps/api'

import { GolfCourse } from '@/types/course'

interface GoogleMapProps {
  courses: GolfCourse[]
  onBoundsChanged: (bounds: google.maps.LatLngBounds) => void
  selectedCourse?: GolfCourse | undefined
  onCourseSelect: (course: GolfCourse) => void
}

const defaultCenter = {
  lat: 39.8283,
  lng: -98.5795
}

const defaultZoom = 4

export default function GoogleMap({
  courses,
  onBoundsChanged,
  selectedCourse,
  onCourseSelect
}: GoogleMapProps): JSX.Element {
  const mapRef = useRef<google.maps.Map | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const apiKey = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY']
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([])

  useEffect(() => {
    console.log('GoogleMap component mounted')
    console.log('Number of courses:', courses.length)
    console.log('API Key available:', !!apiKey)
  }, [courses, apiKey])

  useEffect(() => {
    if (map) {
      console.log('Map loaded, fitting bounds')
      const bounds = new google.maps.LatLngBounds()
      courses.forEach(course => {
        bounds.extend({
          lat: course.location_coordinates_latitude,
          lng: course.location_coordinates_longitude
        })
      })
      map.fitBounds(bounds)
    }
  }, [courses, map])

  useEffect(() => {
    if (!map) {
return
}

    // Clear existing markers
    markers.forEach(marker => marker.map = null)
    setMarkers([])

    // Create new markers
    const newMarkers = courses.map(course => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: {
          lat: course.location_coordinates_latitude,
          lng: course.location_coordinates_longitude
        },
        title: course.courseName,
        content: createMarkerContent(course, selectedCourse?.id === course.id)
      })

      marker.addListener('click', () => onCourseSelect(course))
      return marker
    })

    setMarkers(newMarkers)

    return () => {
      newMarkers.forEach(marker => marker.map = null)
    }
  }, [map, courses, selectedCourse, onCourseSelect, markers])

  const onLoad = (map: google.maps.Map): void => {
    console.log('Map instance loaded')
    mapRef.current = map
    setMap(map)
  }

  const onUnmount = (): void => {
    console.log('Map instance unmounted')
    mapRef.current = null
    setMap(null)
  }

  const handleBoundsChanged = (): void => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds()
      if (bounds) {
        console.log('Bounds changed:', {
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng()
        })
        onBoundsChanged(bounds)
      }
    }
  }

  if (!apiKey) {
    console.error('Google Maps API key is missing')
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-red-500">Error: Google Maps API key is missing</div>
      </div>
    )
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={['places', 'marker']}>
      <GoogleMapComponent
        mapContainerClassName="w-full h-full"
        center={defaultCenter}
        zoom={defaultZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onBoundsChanged={handleBoundsChanged}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        }}
      />
    </LoadScript>
  )
}

function createMarkerContent(course: GolfCourse, _isSelected: boolean): HTMLElement {
  const div = document.createElement('div')
  // Add selected class if needed, similar to the other map component
  // div.className = `marker ${isSelected ? 'selected' : ''}`; 
  // For simplicity, let's omit direct selected styling here, assuming click focuses/zooms.

  // Determine color based on the explicit walkable field
  const isCourseWalkable = course.course_isWalkable === true;
  const markerColor = isCourseWalkable ? '#059669' : '#1E40AF'; // Green-600 vs Blue-800
  const markerText = isCourseWalkable ? 'W' : 'G'; // Text for Walkable/Golf

  // Basic marker style - adjust as needed
  div.style.width = '28px';
  div.style.height = '28px';
  div.style.borderRadius = '50%';
  div.style.backgroundColor = markerColor;
  div.style.color = 'white';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.fontSize = '14px';
  div.style.fontWeight = 'bold';
  div.style.border = '2px solid white';
  div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  div.textContent = markerText;
  
  // REMOVED old innerHTML logic based on rating
  /*
  const walkabilityRating = course.walkabilityRating_overall || 0;
  const color = getWalkabilityColor(walkabilityRating);
  div.innerHTML = `...
  */
  
  return div;
}

// REMOVE unused getWalkabilityColor function
/*
function getWalkabilityColor(rating: number): string {
  // ... old logic ...
}
*/ 