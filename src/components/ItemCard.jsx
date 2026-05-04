import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './ItemCard.css'

export default function ItemCard({ item, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`item-card ${isSortableDragging ? 'item-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <span className="item-grip">⠿</span>
      <span className="item-title">{item.title}</span>
    </div>
  )
}
