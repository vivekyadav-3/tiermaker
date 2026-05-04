import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import ItemCard from './ItemCard'
import './TierBoard.css'

const TIER_CONFIG = {
  S: { label: 'S', color: '#ff4757', glow: 'rgba(255,71,87,0.3)' },
  A: { label: 'A', color: '#ff7f50', glow: 'rgba(255,127,80,0.3)' },
  B: { label: 'B', color: '#ffd700', glow: 'rgba(255,215,0,0.3)' },
  C: { label: 'C', color: '#2ed573', glow: 'rgba(46,213,115,0.3)' },
  D: { label: 'D', color: '#1e90ff', glow: 'rgba(30,144,255,0.3)' },
  unranked: { label: '?', color: '#5a5a70', glow: 'transparent' },
}

function TierRow({ tier, items, readOnly }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.unranked
  const { setNodeRef, isOver } = useDroppable({ id: tier })

  return (
    <div className={`tier-row ${isOver ? 'tier-over' : ''}`} style={{ '--tier-color': cfg.color, '--tier-glow': cfg.glow }}>
      <div className="tier-label" style={{ background: cfg.color }}>
        {cfg.label}
      </div>
      <div ref={!readOnly ? setNodeRef : undefined} className="tier-drop-zone">
        <SortableContext id={tier} items={items.map(i => i.id)} strategy={horizontalListSortingStrategy}>
          {items.length === 0 && !readOnly && (
            <span className="drop-hint">Drop here</span>
          )}
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

export default function TierBoard({ tiers, readOnly = false }) {
  const tierOrder = ['S', 'A', 'B', 'C', 'D', 'unranked']

  return (
    <div className="tier-board">
      {tierOrder.map(tier => (
        <TierRow
          key={tier}
          tier={tier}
          items={tiers[tier] || []}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}

export { TIER_CONFIG }
