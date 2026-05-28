import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quantum Hedge - AI-Powered Crypto Trading',
  description: 'Professional AI-powered crypto trading platform with automated bots, real-time analytics, and copy trading.',
  keywords: ['crypto', 'trading', 'AI', 'bitcoin', 'ethereum', 'binance', 'automated trading', 'trading bots'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
