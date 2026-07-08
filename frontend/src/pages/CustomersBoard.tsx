import React, { useState, useEffect } from 'react'

export default function CustomersBoard() {
  const [customers, setCustomers] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', contact_email: '', contact_phone: '', company_name: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchCustomers = () => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:8000/api/v1/customers/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8000/api/v1/customers/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsModalOpen(false)
        setFormData({ name: '', contact_email: '', contact_phone: '', company_name: '' })
        fetchCustomers()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="header">
        <h1>👥 Customers</h1>
        <button className="btn" onClick={() => setIsModalOpen(true)}>+ New Customer</button>
      </div>

      <div className="data-table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>#{c.id}</td>
                <td>{c.name}</td>
                <td>{c.contact_email}</td>
                <td>{c.contact_phone}</td>
                <td>{c.company_name || '-'}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No customers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Add New Customer</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                <input required type="text" className="input-field" style={{ margin: 0 }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Email *</label>
                <input required type="email" className="input-field" style={{ margin: 0 }} value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Phone *</label>
                <input required type="text" className="input-field" style={{ margin: 0 }} value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Company Name (Optional)</label>
                <input type="text" className="input-field" style={{ margin: 0 }} value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Customer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
