'use client'

import React from 'react'

interface AddressProps {
  address: {
    location_address1: string
    location_address2?: string
    location_city: string
    location_state: string
    location_zip: string
    location_country?: string
  }
}

export default function CourseAddress({ address }: AddressProps): JSX.Element {
  return (
    <div className="flex items-start">
      <div className="mr-3 text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      </div>
      <div>
        <p className="text-gray-700">
          {address.location_address1}
          {address.location_address2 && <><br />{address.location_address2}</>}
          <br />
          {address.location_city}, {address.location_state} {address.location_zip}
          {address.location_country && address.location_country !== 'USA' && address.location_country !== 'United States' && (
            <><br />{address.location_country}</>
          )}
        </p>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${address.location_address1}, ${address.location_city}, ${address.location_state} ${address.location_zip}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 text-sm hover:underline mt-1 inline-block"
        >
          Get Directions
        </a>
      </div>
    </div>
  )
} 