'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/logo'
import { adminLoginAction } from '@/lib/actions/tasks'
import { Lock, User, Info, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    if (!username || !password) {
      setErrorMsg('Please enter both admin Username and Password.')
      return
    }

    setLoading(true)
    try {
      const res = await adminLoginAction(username.trim(), password)
      if (res.success) {
        router.push('/admin/dashboard')
        router.refresh()
      } else {
        setErrorMsg(res.message)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden font-sans"
    >
      {/* Decorative colored spots */}
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-emerald-200/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-slate-200/40 blur-[100px] pointer-events-none" />

      {/* Back button */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-emerald-950 transition-colors uppercase tracking-wider bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[32px] p-8 shadow-xl flex flex-col gap-6 relative z-10 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="p-1 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm mb-4">
            <Logo size={74} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">
            प्रबंधक लॉगिन
          </h2>
          <p className="text-[9px] text-amber-600 font-extrabold uppercase tracking-widest mt-1">
            Admin Management Login
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-750 text-xs py-3 px-4 rounded-2xl font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 tracking-wide" htmlFor="adminUsername">
              Username
            </label>
            <div className="relative text-slate-900">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input
                id="adminUsername"
                type="text"
                placeholder="admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold placeholder-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 tracking-wide" htmlFor="adminPassword">
              Password
            </label>
            <div className="relative text-slate-900">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
              <input
                id="adminPassword"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold placeholder-slate-400 text-slate-800"
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-emerald-900 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-emerald-950 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In as Manager'}
          </button>
        </form>

        {/* Demo instructions */}
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-[20px] p-4.5 flex gap-3 text-slate-600 text-xs font-medium relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600" />
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed pl-1">
            <span className="font-extrabold text-slate-800 block mb-1">Admin Demo Credentials:</span>
            Username is <strong className="text-emerald-900 font-extrabold">admin</strong>.<br />
            Password is <strong className="text-emerald-900 font-extrabold">adminpassword123</strong>.
          </div>
        </div>

      </div>
    </div>
  )
}
