import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: '단기임대 예약관리',
  description: '부모님과 공유하는 단기임대 예약 일정 관리 앱',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '예약관리',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
