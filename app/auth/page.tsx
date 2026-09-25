'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Eye, EyeOff, GraduationCap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage('')
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const supabase = createClient()

    if (mode === 'signup') {
      const fullName = String(form.get('name') ?? '')
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/auth/callback` } })
      if (error) { setMessage(error.message); setLoading(false); return }
      if (!data.session) { setMessage('Check your email to confirm your account, then sign in.'); setLoading(false); return }
      router.replace('/dashboard'); router.refresh(); return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) { setMessage(error?.message || 'Unable to sign in'); setLoading(false); return }
    const { data: staff } = await supabase.from('admin_users').select('user_id,role_id').eq('user_id', data.user.id).eq('is_active', true).maybeSingle()
    const { data: staffRole } = staff ? await supabase.from('roles').select('name').eq('id', staff.role_id).maybeSingle() : { data: null }
    router.replace(staff ? staffRole?.name === 'support_agent' ? '/admin/support' : '/admin' : '/dashboard'); router.refresh()
  }

  return <main className="auth-shell">
    <section className="auth-story"><Link href="/" className="auth-brand"><span><GraduationCap /></span>Admiro</Link><div><p className="auth-eyebrow">A clearer path to university</p><h1>Everything you need to keep moving forward.</h1><ul><li><Check />See what you’ve completed</li><li><Check />Know what you’re waiting for</li><li><Check />Understand what to do next</li></ul></div><p>Built for Nigerian university applicants.</p></section>
    <section className="auth-form-side"><div className="auth-form-wrap"><div className="auth-mobile-brand"><GraduationCap />Admiro</div><p className="eyebrow-dark">{mode === 'signin' ? 'Welcome back' : 'Start your application'}</p><h2>{mode === 'signin' ? 'Sign in to Admiro' : 'Create your account'}</h2><p>{mode === 'signin' ? 'Continue managing your university application.' : 'Set up your student workspace in a few moments.'}</p>
      <form className="auth-form" onSubmit={submit}>{mode === 'signup' && <label>Full name<input name="name" autoComplete="name" placeholder="Enter your full name" required /></label>}<label>Email address<input type="email" name="email" autoComplete="email" placeholder="you@example.com" required /></label><label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} name="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>{mode === 'signin' && <div className="auth-options"><label><input type="checkbox" />Remember me</label><button type="button">Forgot password?</button></div>}<button className="adm-button button-primary full-button" disabled={loading} type="submit">{loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight /></button></form>
      {message && <p className={message.startsWith('Check') ? 'mt-4 text-center text-sm text-emerald-700' : 'mt-4 text-center text-sm text-rose-700'}>{message}</p>}
      <div className="auth-switch">{mode === 'signin' ? 'New to Admiro?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>{mode === 'signin' ? 'Create an account' : 'Sign in'}</button></div><p className="auth-terms">By continuing, you agree to Admiro’s Terms and Privacy Policy.</p></div></section>
  </main>
}
