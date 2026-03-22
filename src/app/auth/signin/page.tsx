'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [mode, setMode] = useState<'signin' | 'register'>('signin')

  // Sign in state
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInError, setSignInError] = useState('')
  const [signInLoading, setSignInLoading] = useState(false)

  // Register state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regError, setRegError] = useState('')
  const [regSuccess, setRegSuccess] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignInError('')
    setSignInLoading(true)

    if (!signInEmail.endsWith('.edu')) {
      setSignInError('Only .edu email addresses are allowed.')
      setSignInLoading(false)
      return
    }

    try {
      const result = await signIn('credentials', {
        email: signInEmail.toLowerCase().trim(),
        password: signInPassword,
        redirect: false,
      })

      if (result?.error) {
        setSignInError(result.error)
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setSignInError('Something went wrong. Please try again.')
    } finally {
      setSignInLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')
    setRegSuccess('')
    setRegLoading(true)

    if (!regEmail.endsWith('.edu')) {
      setRegError('Only .edu email addresses are allowed.')
      setRegLoading(false)
      return
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.')
      setRegLoading(false)
      return
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.')
      setRegLoading(false)
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.toLowerCase().trim(),
          password: regPassword,
          name: regName.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      setRegSuccess('Account created! Signing you in...')

      // Auto sign in after register
      const signInResult = await signIn('credentials', {
        email: regEmail.toLowerCase().trim(),
        password: regPassword,
        redirect: false,
      })

      if (signInResult?.error) {
        setRegError('Account created but sign-in failed. Please sign in manually.')
        setMode('signin')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 flex items-center justify-center px-4 py-12">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gold-500 rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-silver-400 rounded-full opacity-5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <img
              src="/logo.png"
              alt="Put Your Anchor Down"
              className="w-20 h-20 object-contain"
            />
            <span className="text-white font-black text-2xl">
              Put Your <span className="text-gold-400">Anchor Down</span>
            </span>
          </Link>
          <p className="text-silver-400 mt-2 text-sm">
            Student-verified campus reviews
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              onClick={() => {
                setMode('signin')
                setSignInError('')
                setRegError('')
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-navy-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('register')
                setSignInError('')
                setRegError('')
              }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-navy-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Register
            </button>
          </div>

          {/* Sign In Form */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-navy-800">Welcome back</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Sign in with your .edu email
                </p>
              </div>

              {signInError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 text-sm">{signInError}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="signin-email"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  University Email
                </label>
                <input
                  id="signin-email"
                  type="email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label
                  htmlFor="signin-password"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-shadow"
                />
              </div>

              <button
                type="submit"
                disabled={signInLoading}
                className="w-full bg-navy-800 hover:bg-navy-700 disabled:bg-gray-300 text-white disabled:text-gray-500 font-bold py-3.5 rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {signInLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium">
                  Demo accounts: alice@virginia.edu, bob@unc.edu, carol@duke.edu
                  <br />
                  Password: <span className="font-mono font-bold">password123</span>
                </p>
              </div>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-black text-navy-800">Join the Crew</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Create your account with a .edu email
                </p>
              </div>

              {regError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-red-700 text-sm">{regError}</p>
                </div>
              )}

              {regSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-700 text-sm font-medium">{regSuccess}</p>
                </div>
              )}

              <div>
                <label
                  htmlFor="reg-name"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  University Email (.edu required)
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="you@university.edu"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-shadow"
                />
                {regEmail && !regEmail.endsWith('.edu') && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Must be a .edu email address
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label
                  htmlFor="reg-confirm-password"
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-shadow"
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-gray-300 text-navy-900 disabled:text-gray-500 font-bold py-3.5 rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {regLoading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-gray-400 text-sm">
          <Link href="/" className="hover:text-gold-400 transition-colors">
            ← Back to Home
          </Link>
        </p>
      </div>
    </div>
  )
}
