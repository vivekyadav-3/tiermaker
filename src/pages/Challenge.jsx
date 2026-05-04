import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import TierBoard from '../components/TierBoard'
import ItemCard from '../components/ItemCard'
import RankingPanel from '../components/RankingPanel'
import './Challenge.css'

const TIERS = ['S', 'A', 'B', 'C', 'D', 'unranked']
const TIER_SCORE = { S: 5, A: 4, B: 3, C: 2, D: 1 }

function buildTiers(items, myVotes) {
  const map = { S: [], A: [], B: [], C: [], D: [], unranked: [] }
  items.forEach(item => {
    const vote = myVotes[item.id]
    const tier = vote ? vote.tier : 'unranked'
    map[tier] = map[tier] || []
    map[tier].push(item)
  })
  return map
}

export default function Challenge() {
  const { id } = useParams()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [items, setItems] = useState([])
  const [myVotes, setMyVotes] = useState({}) // { item_id: { tier } }
  const [allVotes, setAllVotes] = useState([]) // all votes for ranking
  const [loading, setLoading] = useState(true)
  const [activeItem, setActiveItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState('vote') // 'vote' | 'ranking'
  const channelRef = useRef(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Fetch challenge + items + votes
  useEffect(() => {
    fetchAll()
    subscribeRealtime()
    return () => { channelRef.current?.unsubscribe() }
  }, [id])

  async function fetchAll() {
    const [{ data: ch }, { data: its }, { data: allV }, { data: myV }] = await Promise.all([
      supabase.from('challenges').select('*').eq('id', id).single(),
      supabase.from('items').select('*').eq('challenge_id', id),
      supabase.from('votes').select('*').eq('challenge_id', id),
      user ? supabase.from('votes').select('*').eq('challenge_id', id).eq('user_id', user.id) : { data: [] }
    ])

    setChallenge(ch)
    setItems(its || [])
    setAllVotes(allV || [])

    const voteMap = {}
    ;(myV || []).forEach(v => { voteMap[v.item_id] = v })
    setMyVotes(voteMap)
    setLoading(false)
  }

  function subscribeRealtime() {
    channelRef.current = supabase
      .channel(`votes-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `challenge_id=eq.${id}` }, payload => {
        setAllVotes(prev => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new]
          if (payload.eventType === 'UPDATE') return prev.map(v => v.id === payload.new.id ? payload.new : v)
          if (payload.eventType === 'DELETE') return prev.filter(v => v.id !== payload.old.id)
          return prev
        })
      })
      .subscribe()
  }

  async function saveVote(itemId, tier) {
    if (!user) return
    setSaving(true)
    const existing = myVotes[itemId]

    if (tier === 'unranked') {
      // Delete vote
      if (existing) {
        await supabase.from('votes').delete().eq('user_id', user.id).eq('item_id', itemId)
        setMyVotes(prev => { const next = { ...prev }; delete next[itemId]; return next })
      }
    } else {
      const voteData = { user_id: user.id, item_id: itemId, challenge_id: id, tier }
      const { data } = await supabase.from('votes').upsert(voteData, { onConflict: 'user_id,item_id' }).select().single()
      if (data) setMyVotes(prev => ({ ...prev, [itemId]: data }))
    }
    setSaving(false)
  }

  function findItemTier(itemId) {
    return Object.entries(buildTiers(items, myVotes)).find(([, its]) => its.some(i => i.id === itemId))?.[0] || 'unranked'
  }

  function handleDragStart({ active }) {
    setActiveItem(items.find(i => i.id === active.id) || null)
  }

  async function handleDragEnd({ active, over }) {
    setActiveItem(null)
    if (!over || !user) return

    const fromTier = findItemTier(active.id)
    const toTier = TIERS.includes(over.id) ? over.id : findItemTier(over.id)

    if (fromTier !== toTier) {
      // Update local state optimistically
      setMyVotes(prev => {
        const next = { ...prev }
        if (toTier === 'unranked') { delete next[active.id] }
        else { next[active.id] = { ...(next[active.id] || {}), item_id: active.id, tier: toTier } }
        return next
      })
      await saveVote(active.id, toTier)
    }
  }

  async function copyLink() {
    const shareData = {
      title: `TierForge - ${challenge.title}`,
      text: `Join my tier list challenge: ${challenge.title}`,
      url: window.location.href,
    }

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (err) {
      console.error("Share failed:", err)
    }
  }

  // Compute rankings from all votes
  function computeRankings() {
    const scores = {}
    items.forEach(i => { scores[i.id] = { item: i, score: 0, votes: 0 } })
    allVotes.forEach(v => {
      if (scores[v.item_id]) {
        scores[v.item_id].score += TIER_SCORE[v.tier] || 0
        scores[v.item_id].votes += 1
      }
    })
    return Object.values(scores).sort((a, b) => b.score - a.score)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  )

  if (!challenge) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h2>Challenge not found</h2>
      <Link to="/" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>← Go Home</Link>
    </div>
  )

  const tiers = buildTiers(items, myVotes)
  const rankings = computeRankings()
  const isCreator = user?.id === challenge.created_by
  const votedCount = Object.keys(myVotes).length

  return (
    <div className="challenge-page page-container fade-in">
      {/* Header */}
      <div className="challenge-header">
        <div className="challenge-header-top">
          <Link to="/" className="back-link">← All Challenges</Link>
          <div className="challenge-badges">
            {isCreator && <span className="badge badge-creator">👑 Creator</span>}
            {saving && <span className="badge badge-saving">Saving...</span>}
          </div>
        </div>
        <h1 className="challenge-heading">{challenge.title}</h1>
        <div className="challenge-meta-row">
          <span className="meta-item">🎯 {items.length} items</span>
          <span className="meta-item">🗳️ {allVotes.length} total votes</span>
          {user && <span className="meta-item">✅ {votedCount} ranked</span>}
          <button className="btn btn-secondary share-btn" onClick={copyLink}>
            {copied ? '✓ Copied!' : '🔗 Share'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="challenge-tabs">
        <button className={`tab-btn ${tab === 'vote' ? 'active' : ''}`} onClick={() => setTab('vote')}>
          🎮 {user ? 'My Rankings' : 'View Tier List'}
        </button>
        <button className={`tab-btn ${tab === 'ranking' ? 'active' : ''}`} onClick={() => setTab('ranking')}>
          📊 Community Rankings
          <span className="tab-badge">{allVotes.length}</span>
        </button>
      </div>

      {tab === 'vote' ? (
        <div className="vote-section">
          {!user && (
            <div className="auth-prompt">
              <span>👤 Sign in to vote and rank items</span>
              <Link to="/auth" className="btn btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>Sign In</Link>
            </div>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <TierBoard tiers={tiers} readOnly={!user} />
            <DragOverlay>
              {activeItem && <ItemCard item={activeItem} isDragging />}
            </DragOverlay>
          </DndContext>
          {user && (
            <p className="drag-hint">💡 Drag items between tiers to cast your vote. Changes save instantly.</p>
          )}
        </div>
      ) : (
        <RankingPanel rankings={rankings} allVotes={allVotes} items={items} />
      )}
    </div>
  )
}
