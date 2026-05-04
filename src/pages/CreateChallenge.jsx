import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './CreateChallenge.css'

const SAMPLE_ITEMS = ['Item 1', 'Item 2', 'Item 3']

export default function CreateChallenge() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [items, setItems] = useState(['', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addItem() { setItems(prev => [...prev, '']) }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function updateItem(i, val) { setItems(prev => prev.map((item, idx) => idx === i ? val : item)) }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    const validItems = items.filter(i => i.trim())
    if (!title.trim()) return setError('Challenge title is required')
    if (validItems.length < 2) return setError('Add at least 2 items')

    setLoading(true)
    try {
      // Insert challenge
      const { data: challenge, error: cErr } = await supabase
        .from('challenges')
        .insert({ title: title.trim(), created_by: user.id })
        .select()
        .single()

      if (cErr) throw cErr

      // Insert items
      const { error: iErr } = await supabase
        .from('items')
        .insert(validItems.map(t => ({ challenge_id: challenge.id, title: t.trim(), description: '' })))

      if (iErr) throw iErr

      navigate(`/challenge/${challenge.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="create-page page-container fade-in">
      <div className="create-header">
        <h1>Create Challenge</h1>
        <p>Set a title and add the items people will rank.</p>
      </div>

      {error && <div className="auth-alert auth-alert-error" style={{ maxWidth: 640, marginBottom: 24 }}>{error}</div>}

      <form className="create-form" onSubmit={handleCreate}>
        <div className="create-section">
          <label className="section-label">Challenge Title</label>
          <input
            className="input"
            placeholder="e.g. Rank these programming languages"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={120}
            style={{ maxWidth: 640 }}
          />
        </div>

        <div className="create-section">
          <label className="section-label">Items <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({items.filter(i=>i.trim()).length} added)</span></label>
          <div className="items-list">
            {items.map((item, i) => (
              <div key={i} className="item-row fade-in">
                <span className="item-num">{i + 1}</span>
                <input
                  className="input"
                  placeholder={`Item ${i + 1}`}
                  value={item}
                  onChange={e => updateItem(i, e.target.value)}
                  maxLength={80}
                />
                {items.length > 2 && (
                  <button type="button" className="remove-btn" onClick={() => removeItem(i)} title="Remove">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-secondary add-item-btn" onClick={addItem}>
            + Add Item
          </button>
        </div>

        <div className="create-actions">
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '13px 32px', fontSize: '15px' }}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating...</> : '⚡ Create & Share'}
          </button>
        </div>
      </form>
    </div>
  )
}
