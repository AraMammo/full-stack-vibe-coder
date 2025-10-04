import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Full Stack Vibe Coder - Digital Agency',
  description: 'Cutting-edge digital solutions with chaotic creativity. We build the future, one line of code at a time.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
