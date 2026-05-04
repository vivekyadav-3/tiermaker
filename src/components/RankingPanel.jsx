import React from 'react'
import './RankingPanel.css'

const TIER_SCORE = { S: 5, A: 4, B: 3, C: 2, D: 1 }
const TIER_CONFIG = {
  S: '#ff4757', A: '#ff7f50', B: '#ffd700', C: '#2ed573', D: '#1e90ff'
}

export default function RankingPanel({ rankings, allVotes, items }) {
  const maxScore = rankings[0]?.score || 1

  // Count votes per tier per item
  function getTierBreakdown(itemId) {
    const counts = { S: 0, A: 0, B: 0, C: 0, D: 0 }
    allVotes.filter(v => v.item_id === itemId).forEach(v => {
      if (counts[v.tier] !== undefined) counts[v.tier]++
    })
    return counts
  }

  const uniqueVoters = new Set(allVotes.map(v => v.user_id)).size

  return (
    <div className="ranking-panel fade-in">
      <div className="ranking-header">
        <div className="ranking-stat">
          <span className="stat-num">{uniqueVoters}</span>
          <span className="stat-label">Voters</span>
        </div>
        <div className="ranking-stat">
          <span className="stat-num">{allVotes.length}</span>
          <span className="stat-label">Total Votes</span>
        </div>
        <div className="ranking-stat">
          <span className="stat-num">{items.length}</span>
          <span className="stat-label">Items</span>
        </div>
      </div>

      <div className="ranking-list">
        {rankings.map((r, i) => {
          const breakdown = getTierBreakdown(r.item.id)
          const barWidth = maxScore > 0 ? (r.score / maxScore) * 100 : 0
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

          return (
            <div key={r.item.id} className="ranking-row">
              <div className="rank-num">{medal || `#${i + 1}`}</div>
              <div className="rank-info">
                <div className="rank-top">
                  <span className="rank-title">{r.item.title}</span>
                  <span className="rank-score">{r.score} pts · {r.votes} vote{r.votes !== 1 ? 's' : ''}</span>
                </div>
                <div className="rank-bar-bg">
                  <div className="rank-bar-fill" style={{ width: `${barWidth}%` }} />
                </div>
                <div className="tier-breakdown">
                  {Object.entries(breakdown).filter(([,c]) => c > 0).map(([tier, count]) => (
                    <span key={tier} className="tier-pill" style={{ background: TIER_CONFIG[tier] + '22', border: `1px solid ${TIER_CONFIG[tier]}55`, color: TIER_CONFIG[tier] }}>
                      {tier}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {rankings.every(r => r.score === 0) && (
        <div className="empty-ranking">
          <p>No votes yet. Be the first to rank!</p>
        </div>
      )}
    </div>
  )
}
