import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './Home.css'

export default function Home() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenges()
  }, [])

  async function fetchChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select('*, items(count)')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error) setChallenges(data || [])
    setLoading(false)
  }

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero fade-in">
        <div className="hero-badge">⚡ Real-time collaborative voting</div>
        <h1 className="hero-title">
          Build Tier Lists.<br />
          <span className="hero-gradient">Let The World Vote.</span>
        </h1>
        <p className="hero-subtitle">
          Create a challenge, share the link, watch friends drag &amp; drop items into tiers — all in real-time.
        </p>
        <div className="hero-cta">
          {user ? (
            <Link to="/create" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
              ⚡ Create Challenge
            </Link>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
              Get Started Free
            </Link>
          )}
        </div>
        <div className="hero-features">
          {['🎯 Drag & Drop Voting', '⚡ Real-time Updates', '📊 Live Rankings', '🔒 One Vote Per User'].map(f => (
            <span key={f} className="feature-pill">{f}</span>
          ))}
        </div>
      </section>

      {/* Challenges Grid */}
      <section className="challenges-section page-container">
        <div className="section-header">
          <h2>Recent Challenges</h2>
          <span className="text-muted">{challenges.length} active</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No challenges yet</h3>
            <p>Be the first to create one!</p>
            <Link to={user ? '/create' : '/auth'} className="btn btn-primary">Create Challenge</Link>
          </div>
        ) : (
          <div className="challenges-grid">
            {challenges.map((c, i) => (
              <Link to={`/challenge/${c.id}`} key={c.id} className="challenge-card fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="challenge-card-top">
                  <span className="challenge-icon">🏆</span>
                  <span className="challenge-date">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="challenge-title">{c.title}</h3>
                <div className="challenge-meta">
                  <span>{c.items?.[0]?.count ?? 0} items</span>
                  <span className="challenge-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
