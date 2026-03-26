import DatePickerCard from './cards/DatePickerCard.jsx'
import AddressCard from './cards/AddressCard.jsx'
import EstimateCard from './cards/EstimateCard.jsx'
import ServiceSelectCard from './cards/ServiceSelectCard.jsx'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, onCardSubmit }) {
  const { role, content, card, created_at } = message
  const isUser = role === 'user'
  const isSystem = role === 'system'

  if (isSystem) {
    return (
      <div className="message-row message-row--system">
        <span className="message-bubble message-bubble--system">{content}</span>
      </div>
    )
  }

  return (
    <div className={`message-row${isUser ? ' message-row--user' : ''}`}>
      {!isUser && (
        <div className="message-avatar message-avatar--ai">당</div>
      )}

      <div className="message-content">
        {content && (
          <div className={`message-bubble message-bubble--${isUser ? 'user' : 'ai'}`}>
            {content}
          </div>
        )}

        {card && (
          <CardRenderer card={card} onSubmit={onCardSubmit} />
        )}

        {created_at && (
          <span className="message-time">{formatTime(created_at)}</span>
        )}
      </div>

      {isUser && (
        <div className="message-avatar message-avatar--user">나</div>
      )}
    </div>
  )
}

function CardRenderer({ card, onSubmit }) {
  switch (card.type) {
    case 'date_picker':
      return <DatePickerCard data={card.data} onSubmit={onSubmit} />
    case 'address_picker':
      return <AddressCard data={card.data} onSubmit={onSubmit} />
    case 'estimate':
      return <EstimateCard data={card.data} onSubmit={onSubmit} />
    case 'service_select':
      return <ServiceSelectCard data={card.data} onSubmit={onSubmit} />
    default:
      return null
  }
}

export function TypingIndicator() {
  return (
    <div className="message-row">
      <div className="message-avatar message-avatar--ai">당</div>
      <div className="message-content">
        <div className="message-bubble message-bubble--ai" style={{ padding: 0 }}>
          <div className="typing-indicator">
            <span /><span /><span />
          </div>
        </div>
      </div>
    </div>
  )
}
