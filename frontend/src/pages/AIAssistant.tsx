import React, { useState, useRef, useEffect } from 'react'

export default function AIAssistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: 'Hello! I am your LogisticsCopilot. Ask me about the fleet, idle trucks, or loads at risk!' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8000/api/v1/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered a network error while fetching data.' }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <div className="header">
        <h1>💬 AI Fleet Assistant</h1>
      </div>

      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1.5rem' }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              background: msg.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
              padding: '1rem 1.5rem',
              borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
              maxWidth: '80%',
              border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{msg.content}</p>
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '12px 12px 12px 0', border: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Antigravity is analyzing database...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <input
            type="text"
            className="input-field"
            style={{ margin: 0 }}
            placeholder="e.g. How many trucks are currently idle?"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" className="btn" disabled={isLoading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
