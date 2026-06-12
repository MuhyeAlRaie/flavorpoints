'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { api } from '@/lib/api'
import { AuthScreen } from '@/components/auth/auth-screen'
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { EmployeeDashboard } from '@/components/employee/employee-dashboard'
import { Database, ExternalLink, Key, Server } from 'lucide-react'

function SetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4">
            <Database className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            FlavorPoints Setup
          </h1>
          <p className="text-muted-foreground mt-2">Connect your Supabase backend to get started</p>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            Step 1: Create a Supabase Project
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener" className="text-purple-400 underline">supabase.com</a> and create a free account</li>
            <li>Create a new project and wait for it to provision</li>
            <li>Go to <strong>Project Settings → API</strong></li>
            <li>Copy your <strong>Project URL</strong> and <strong>anon/public key</strong></li>
          </ol>

          <h2 className="text-lg font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            Step 2: Run the Database Schema
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>In Supabase, go to <strong>SQL Editor</strong></li>
            <li>Copy the contents of <code className="bg-white/5 px-1.5 py-0.5 rounded">supabase/schema.sql</code> and run it</li>
            <li>Then copy and run <code className="bg-white/5 px-1.5 py-0.5 rounded">supabase/seed.sql</code> to add demo data</li>
          </ol>

          <h2 className="text-lg font-bold flex items-center gap-2">
            <Key className="w-5 h-5 text-purple-400" />
            Step 3: Disable Email Confirmation
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Go to <strong>Authentication → Providers → Email</strong></li>
            <li>Turn <strong>OFF</strong> &quot;Confirm email&quot;</li>
            <li>Save the changes</li>
          </ol>

          <h2 className="text-lg font-bold flex items-center gap-2">
            <ExternalLink className="w-5 h-5 text-purple-400" />
            Step 4: Set Environment Variables
          </h2>
          <div className="glass-card p-4 font-mono text-xs space-y-1">
            <p className="text-muted-foreground"># Create a .env.local file with:</p>
            <p><span className="text-green-400">NEXT_PUBLIC_SUPABASE_URL</span>=<span className="text-yellow-400">https://your-project.supabase.co</span></p>
            <p><span className="text-green-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=<span className="text-yellow-400">your-anon-key-here</span></p>
          </div>
          <p className="text-xs text-muted-foreground">For GitHub Pages: also set <code className="bg-white/5 px-1 py-0.5 rounded">NEXT_PUBLIC_BASE_PATH</code> to your repo name (e.g., <code className="bg-white/5 px-1 py-0.5 rounded">/flavorpoints</code>)</p>

          <div className="pt-2 text-center">
            <p className="text-sm text-amber-400">Restart the dev server after adding environment variables</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { isAuthenticated, user, login, clearAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const initRef = useRef(false)

  // If Supabase isn't configured, show setup guide
  const showSetupGuide = !isSupabaseConfigured

  // Check for existing Supabase session on mount
  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (initRef.current) return
    initRef.current = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: profile } = await supabase
            .from('customers')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            login(
              { ...profile, totalVisits: profile.total_visits, createdAt: profile.created_at, updatedAt: profile.updated_at },
              session.access_token
            )
          } else {
            // No profile - sign out since account is incomplete
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
      }
      setIsChecking(false)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        // Just clear local state - don't call supabase.auth.signOut() again
        clearAuth()
      }
    })

    return () => subscription.unsubscribe()
  }, [login, clearAuth])

  // Show setup guide if Supabase isn't configured
  if (showSetupGuide) {
    return <SetupGuide />
  }

  if (isChecking && isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto animate-pulse-glow">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
              <path d="M7 2v20" />
              <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
            </svg>
          </div>
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading FlavorPoints...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />
    case 'employee':
      return <EmployeeDashboard />
    default:
      return <CustomerDashboard />
  }
}
