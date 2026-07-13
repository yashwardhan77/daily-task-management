import React from 'react'
import Link from 'next/link'
import Logo from '@/components/logo'
import { Calendar, UserCheck, ShieldAlert, ArrowRight, BookOpen, Boxes } from 'lucide-react'

export default function HomePage() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Decorative Grid Background Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(#0f172a 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />
      
      {/* Soft color highlights */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-200/20 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-100/25 blur-[120px] pointer-events-none z-0" />

      {/* Glass header */}
      <header className="glass-panel sticky top-0 z-50 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={44} className="shadow-lg rounded-xl border border-slate-100" />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-wide leading-none">
                विद्या भारती सेवाधाम
              </h1>
              <p className="text-[9px] sm:text-[10px] text-amber-600 font-extrabold tracking-widest uppercase mt-0.5">
                VIDHYA BHARATI SEWADHAM
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-100 text-xs font-bold text-sky-850">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            दैनिक कार्य प्रगति
          </span>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-grow flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 relative z-10 animate-fade-in-up">
        <div className="max-w-4xl w-full flex flex-col items-center gap-12">
          
          {/* Logo & Welcome text */}
          <div className="text-center flex flex-col items-center">
            <div className="relative p-2 bg-white rounded-[32px] shadow-2xl border border-slate-150/50 mb-6 animate-bounce-subtle">
              <Logo size={130} />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-md border border-white">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              दैनिक कार्य प्रगति पोर्टल
            </h2>
            <p className="text-amber-600 text-xs sm:text-sm font-extrabold uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <span>Daily Task Management System</span>
            </p>
            <p className="text-slate-500 text-xs sm:text-sm max-w-lg mt-5 leading-relaxed font-medium">
              Welcome to the internal task tracking portal. Log tasks, submit presence status, check weekly metrics, and manage administrative reports.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            
            {/* Employee Card */}
            <Link
              href="/employee/login"
              className="group bg-white hover:bg-slate-900 hover:text-white rounded-[24px] p-6 border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden"
            >
              {/* background vector */}
              <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-sky-50 group-hover:bg-slate-800 rounded-full blur-2xl transition-all duration-300" />
              
              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-white transition-colors">
                    कर्मचारी लॉगिन (Employee)
                  </h3>
                  <p className="text-xs text-slate-500 group-hover:text-slate-350 mt-2 font-medium leading-relaxed">
                    Submit presence, split tasks into before/after lunch logs, record holiday reason, and view personal logs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-sky-600 group-hover:text-amber-400 tracking-wider uppercase transition-colors relative z-10">
                <span>Enter ID & password</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            {/* Inventory Card */}
            <Link
              href="/inventory/login"
              className="group bg-white hover:bg-slate-900 hover:text-white rounded-[24px] p-6 border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden"
            >
              {/* background vector */}
              <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-emerald-50 group-hover:bg-slate-800 rounded-full blur-2xl transition-all duration-300" />

              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <Boxes className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-white transition-colors">
                    इन्वेंट्री प्रबंधन (Inventory)
                  </h3>
                  <p className="text-xs text-slate-500 group-hover:text-slate-350 mt-2 font-medium leading-relaxed">
                    Manage food & cleaning items, estimate program requirements, track material issues, consumption, and generate reports.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:text-amber-400 tracking-wider uppercase transition-colors relative z-10">
                <span>Inventory Access</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

            {/* Admin Card */}
            <Link
              href="/admin/login"
              className="group bg-white hover:bg-slate-900 hover:text-white rounded-[24px] p-6 border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden"
            >
              {/* background vector */}
              <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-amber-50 group-hover:bg-slate-800 rounded-full blur-2xl transition-all duration-300" />

              <div className="flex flex-col gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-white transition-colors">
                    प्रबंधक लॉगिन (Admin / Principal)
                  </h3>
                  <p className="text-xs text-slate-500 group-hover:text-slate-350 mt-2 font-medium leading-relaxed">
                    Monitor staff daily logs, review progress details, track weekly stats, and export logs to Excel reports.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 group-hover:text-amber-400 tracking-wider uppercase transition-colors relative z-10">
                <span>Administrative Access</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t py-6 text-center text-slate-400 text-xs relative z-15">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {currentYear} विद्या भारती सेवाधाम। सर्वाधिकार सुरक्षित।</p>
          <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            <span>Education</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span>Purity</span>
            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
            <span>Service</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
