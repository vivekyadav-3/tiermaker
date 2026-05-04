import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">⚡</span>
          <span className="logo-text">TierForge</span>
        </Link>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/create" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
                + New Challenge
              </Link>
              <div className="user-menu">
                <button className="user-avatar" onClick={() => setMenuOpen(!menuOpen)} title={user.email || 'Guest'}>
                  {user.email ? user.email[0].toUpperCase() : 'G'}
                </button>
                {menuOpen && (
                  <div className="user-dropdown">
                    <div className="user-email">{user.email || 'Guest Session'}</div>
                    <button className="btn btn-ghost" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'flex-start', color: '#ff4757' }}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
