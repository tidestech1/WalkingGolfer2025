import React from 'react'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'
import FooterWrapper from '@/app/components/FooterWrapper'
import GoogleAnalytics from '@/app/components/GoogleAnalytics'
import SchemaMarkup from '@/app/components/SchemaMarkup'
import ScrollToTop from '@/app/components/ScrollToTop'
import FirebaseInitializer from '@/components/FirebaseInitializer'
import { GA_MEASUREMENT_ID } from '@/lib/constants/analytics'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { MobileMenuProvider } from '@/lib/contexts/MobileMenuContext'

import NavbarWrapper from './components/NavbarWrapper'
import WelcomeModal from './components/WelcomeModal'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://www.walkinggolfer.com'),
  title: 'Walking Golfer',
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <SchemaMarkup type="organization" />
        <SchemaMarkup type="website" />
      </head>
      <body className={inter.className}>
        <FirebaseInitializer />
        <MobileMenuProvider>
          <AuthProvider>
            <NavbarWrapper />
            <main>{children}</main>
            <ScrollToTop />
            <FooterWrapper />
            <WelcomeModal />
            {/* 
              TOAST SYSTEM STANDARD: Use Sonner across entire app
              - Import: import { toast } from 'sonner' 
              - Success: toast.success('message')
              - Error: toast.error('message') 
              - Info: toast.info('message')
              - Loading: toast.loading('message')
              - Promise: toast.promise(promise, { loading: '...', success: '...', error: '...' })
              - DO NOT create custom toast components or use other libraries
            */}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </MobileMenuProvider>
      </body>
    </html>
  )
}
