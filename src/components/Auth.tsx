import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Auth() {
  const { signup, login } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') await signup(email, password)
      else await login(email, password)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="screen onboarding">
      <div className="onboarding-card">
        <h1>Medicina</h1>
        <p className="muted">A private, on-device-first medication reminder.</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'signup' ? 'ghost active' : 'ghost'}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
          <button type="button" className={mode === 'login' ? 'ghost active' : 'ghost'} onClick={() => setMode('login')}>
            Log in
          </button>
        </div>

        <form onSubmit={submit} className="form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          {mode === 'signup' && <p className="muted small">At least 8 characters.</p>}
          {formError && <p className="error-text">{formError}</p>}
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="muted small legal">
          Your account only stores your medication schedule and dose history. See the privacy screen after signing
          in for exactly what's collected and why.
        </p>
      </div>
    </div>
  )
}
