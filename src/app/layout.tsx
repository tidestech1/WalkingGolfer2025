import React from 'react'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import FooterWrapper from '@/app/components/FooterWrapper'
import GoogleAnalytics from '@/app/components/GoogleAnalytics'
import ScrollToTop from '@/app/components/ScrollToTop'
import FirebaseInitializer from '@/components/FirebaseInitializer'
import { GA_MEASUREMENT_ID } from '@/lib/constants/analytics'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { MobileMenuProvider } from '@/lib/contexts/MobileMenuContext'

import NavbarWrapper from './components/NavbarWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'The Walking Golfer',
  description: 'Find and review walkable golf courses',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', type: 'image/png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
      </head>
      <body className={inter.className}>
        <FirebaseInitializer />
        <MobileMenuProvider>
          <AuthProvider>
            <NavbarWrapper />
            {children}
            <ScrollToTop />
            <FooterWrapper />
          </AuthProvider>
        </MobileMenuProvider>
      </body>
    </html>
  )
}
