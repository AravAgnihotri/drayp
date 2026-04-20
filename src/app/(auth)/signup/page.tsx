"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingBag, Eye, EyeOff, AlertCircle, MailCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export default function SignupPage() {
  const supabase = createClient()

  const [name,         setName]         = useState("")
  const [email,        setEmail]        = useState("")
  const [password,     setPassword]     = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [googleBusy,   setGoogleBusy]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [emailSent,    setEmailSent]    = useState(false)

  const anyBusy = submitting || googleBusy

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setSubmitting(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      setEmailSent(true)
    }
  }

  async function handleGoogleSignUp() {
    setGoogleBusy(true)
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  // ── Email confirmation sent state ──
  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-6 font-dm-sans">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] text-white shadow-sm">
            <ShoppingBag className="h-[18px] w-[18px]" />
          </div>
          <span className="text-xl font-bold text-gray-900">Drayp</span>
        </Link>

        <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#E1F5EE]">
            <MailCheck className="h-7 w-7 text-[#0F6E56]" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">
            We sent a confirmation link to{" "}
            <span className="font-medium text-gray-800">{email}</span>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-6 font-dm-sans">
      {/* Logo */}
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#0F6E56] text-white shadow-sm">
          <ShoppingBag className="h-[18px] w-[18px]" />
        </div>
        <span className="text-xl font-bold text-gray-900">Drayp</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[400px] rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-7 text-center">
          <h1 className="text-[22px] font-semibold text-gray-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Start finding clothes that actually fit
          </p>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={anyBusy}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleBusy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <GoogleIcon />
          )}
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            or sign up with email
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSignUp} className="space-y-4" noValidate>
          {/* Full name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              disabled={anyBusy}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 disabled:opacity-50"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={anyBusy}
              className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 disabled:opacity-50"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
              <span className="ml-1 text-xs font-normal text-gray-400">(min 8 characters)</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                disabled={anyBusy}
                className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 pr-11 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-[#1D9E75] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={anyBusy}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-[#0F6E56] text-sm font-semibold text-white shadow-sm transition hover:bg-[#085041] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>

      {/* Sign-in link */}
      <p className="mt-6 text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0F6E56] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
