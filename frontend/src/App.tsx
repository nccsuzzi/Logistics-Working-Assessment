import React, { useState } from 'react'
import DispatchBoard from './pages/DispatchBoard'
import AIAssistant from './pages/AIAssistant'
import FleetBoard from './pages/FleetBoard'
import CustomersBoard from './pages/CustomersBoard'

function App() {
  const [view, setView] = useState('dispatch')
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)
      
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      })
      if (!res.ok) {
        alert("Invalid credentials")
        return
      }
      const data = await res.json()
      setToken(data.access_token)
      localStorage.setItem('token', data.access_token)
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('token')
  }

  if (!token) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', width: '400px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>🚚 AI Logistics Login</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input type="email" placeholder="Email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }}>Sign In</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>🚚 AI Logistics</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a href="#" className={`nav-link ${view === 'dispatch' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('dispatch'); }}>Dispatch Board</a>
          <a href="#" className={`nav-link ${view === 'fleet' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('fleet'); }}>Fleet & Drivers</a>
          <a href="#" className={`nav-link ${view === 'customers' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('customers'); }}>Customers</a>
          <a href="#" className={`nav-link ${view === 'assistant' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setView('assistant'); }}>✨ AI Assistant</a>
        </nav>
        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleLogout}>Log Out</button>
        </div>
      </aside>
      
      <main className="main-content">
        {view === 'dispatch' && <DispatchBoard />}
        {view === 'fleet' && <FleetBoard />}
        {view === 'customers' && <CustomersBoard />}
        {view === 'assistant' && <AIAssistant />}
      </main>
    </div>
  )
}

export default App
