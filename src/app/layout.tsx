import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SessionProvider from './SessionProvider'
import { UniversityProvider } from '@/context/UniversityContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Put Your Anchor Down — The College Student\'s Local Guide',
  description:
    'Discover the best campus spots, restaurants, and attractions near your university. Reviews by students, for students.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <UniversityProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">{children}</main>
            <footer className="bg-white text-silver-500 py-8 mt-auto border-t border-silver-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/logo.png"
                      alt="Put Your Anchor Down"
                      width={28}
                      height={28}
                      className="w-7 h-7 object-contain"
                    />
                    <span className="text-navy-800 font-semibold">
                      Put Your <span className="text-gold-500">Anchor Down</span>
                    </span>
                  </div>
                  <p className="text-sm text-silver-500">
                    Built for students, by students. Share your campus experience.
                  </p>
                  <p className="text-sm text-silver-600">
                    © {new Date().getFullYear()} Put Your Anchor Down
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </UniversityProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
