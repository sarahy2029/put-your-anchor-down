'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-silver-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Put Your Anchor Down"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
              />
              <span className="text-navy-800 font-bold text-lg tracking-tight hidden sm:inline">
                Put Your <span className="text-gold-500">Anchor Down</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-navy-700 hover:text-gold-600 transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/locations"
              className="text-navy-700 hover:text-gold-600 transition-colors font-medium"
            >
              Explore
            </Link>
            <Link
              href="/bracket"
              className="text-navy-700 hover:text-gold-600 transition-colors font-medium"
            >
              Bracket
            </Link>
            <Link
              href="/map"
              className="text-navy-700 hover:text-gold-600 transition-colors font-medium"
            >
              Map
            </Link>
            {session && (
              <Link
                href="/for-you"
                className="text-navy-700 hover:text-gold-600 transition-colors font-medium"
              >
                For You
              </Link>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {status === 'loading' ? (
              <div className="w-20 h-8 bg-silver-100 rounded animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-4">
                <Link
                  href="/locations/new"
                  className="bg-gold-500 hover:bg-gold-400 text-navy-900 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Post
                </Link>
                <Link
                  href="/profile"
                  className="text-navy-600 hover:text-gold-600 text-sm font-medium transition-colors"
                >
                  Hi, {session.user?.name?.split(' ')[0]}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-silver-100 hover:bg-silver-200 text-navy-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-silver-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="bg-gold-500 hover:bg-gold-400 text-navy-900 px-5 py-2 rounded-lg text-sm font-bold transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-navy-700 hover:text-navy-900 p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-silver-200 py-4 bg-white">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="text-navy-700 hover:text-gold-600 transition-colors font-medium px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/locations"
                className="text-navy-700 hover:text-gold-600 transition-colors font-medium px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore
              </Link>
              <Link
                href="/bracket"
                className="text-navy-700 hover:text-gold-600 transition-colors font-medium px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Bracket
              </Link>
              <Link
                href="/map"
                className="text-navy-700 hover:text-gold-600 transition-colors font-medium px-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Map
              </Link>
              {session && (
                <Link
                  href="/for-you"
                  className="text-navy-700 hover:text-gold-600 transition-colors font-medium px-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  For You
                </Link>
              )}
              <div className="pt-2 border-t border-silver-200">
                {session ? (
                  <div className="flex flex-col gap-2 px-2">
                    <Link
                      href="/locations/new"
                      className="bg-gold-500 hover:bg-gold-400 text-navy-900 px-4 py-2 rounded-lg text-sm font-bold text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      + Create Post
                    </Link>
                    <Link
                      href="/profile"
                      className="text-navy-700 hover:text-gold-600 text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <span className="text-silver-500 text-sm">
                      {session.user?.email}
                    </span>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false)
                        signOut({ callbackUrl: '/' })
                      }}
                      className="bg-silver-100 text-navy-700 px-4 py-2 rounded-lg text-sm font-medium w-full text-left"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="bg-gold-500 hover:bg-gold-400 text-navy-900 px-5 py-2 rounded-lg text-sm font-bold inline-block mx-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
