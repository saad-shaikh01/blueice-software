import type { Metadata } from 'next';

export const siteConfig: Metadata = {
  title: 'Blue Ice',
  description: 'Blue Ice CRM - Water Supply Management System',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Blue Ice Driver',
  },
  formatDetection: {
    telephone: false, // Prevent auto-detection of phone numbers
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false, // Prevent zooming for app-like feel
  },
} as const;