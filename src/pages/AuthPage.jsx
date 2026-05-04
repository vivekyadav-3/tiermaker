import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

export default function AuthPage() {
  const { user, signIn, signUp, signInAnonymously } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (user) { navigate('/'); return null }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)

    if (mode === 'signup') {
      const { error: err } = await signUp(email, password)
      if (err) setError(err.message)
      else setSuccess('Check your email to confirm your account!')
    } else {
      const { error: err } = await signIn(email, password)
      if (err) setError(err.message)
      else navigate('/')
    }
    setLoading(false)
  }

  const handleGuestLogin = async () => {
    try {
      setLoading(true)
      const { error } = await signInAnonymously()
      if (error) throw error
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <div className="auth-logo">⚡ TierForge</div>
        <h1 className="auth-title">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h1>
        <p className="auth-subtitle">
          {mode === 'signin' ? 'Sign in to create and vote on challenges' : 'Join TierForge — it\'s free forever'}
        </p>

        {error && <div className="auth-alert auth-alert-error">{error}</div>}
        {success && <div className="auth-alert auth-alert-success">{success}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Processing...</> : (mode === 'signin' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button className="btn btn-secondary guest-btn" onClick={handleGuestLogin} disabled={loading}>
          👤 Join as Guest (Instant)
        </button>

        <div className="auth-switch">
          {mode === 'signin' ? (
            <>Don't have an account? <button className="auth-link" onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Sign up</button></>
          ) : (
            <>Already have an account? <button className="auth-link" onClick={() => { setMode('signin'); setError(''); setSuccess('') }}>Sign in</button></>
          )}
        </div>
      </div>
    </div>
  )
}
