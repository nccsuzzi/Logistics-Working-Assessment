import React, { useState, useEffect } from 'react'

export default function FleetBoard() {
  const [trucks, setTrucks] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])

  const [isTruckModalOpen, setIsTruckModalOpen] = useState(false)
  const [truckForm, setTruckForm] = useState({ identifier: '', capacity: '', current_location: '' })
  
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false)
  const [driverForm, setDriverForm] = useState({ name: '', license_number: '' })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = () => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:8000/api/v1/trucks/', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json())
      .then(data => setTrucks(data))
      
    fetch('http://localhost:8000/api/v1/drivers/', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json())
      .then(data => setDrivers(data))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateTruck = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const payload = {
        identifier: truckForm.identifier,
        capacity: Number(truckForm.capacity),
        current_location: truckForm.current_location || null
      }
      const res = await fetch('http://localhost:8000/api/v1/trucks/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setIsTruckModalOpen(false)
        setTruckForm({ identifier: '', capacity: '', current_location: '' })
        fetchData()
      }
    } catch (err) { console.error(err) }
    finally { setIsSubmitting(false) }
  }

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('http://localhost:8000/api/v1/drivers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(driverForm)
      })
      if (res.ok) {
        setIsDriverModalOpen(false)
        setDriverForm({ name: '', license_number: '' })
        fetchData()
      }
    } catch (err) { console.error(err) }
    finally { setIsSubmitting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <div className="header" style={{ marginBottom: 0 }}>
        <h1>🚚 Fleet & Drivers</h1>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Trucks Overview</h2>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }} onClick={() => setIsTruckModalOpen(true)}>+ Add Truck</button>
        </div>
        <div className="data-table-container glass-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID / Identifier</th>
                <th>Capacity (lbs)</th>
                <th>Current Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map(t => (
                <tr key={t.id}>
                  <td>#{t.id} - <strong>{t.identifier}</strong></td>
                  <td>{t.capacity.toLocaleString()}</td>
                  <td>{t.current_location}</td>
                  <td><span className={`status-badge status-${t.status}`}>{t.status}</span></td>
                </tr>
              ))}
              {trucks.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No trucks found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Drivers Overview</h2>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }} onClick={() => setIsDriverModalOpen(true)}>+ Add Driver</button>
        </div>
        <div className="data-table-container glass-panel">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>License No.</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map(d => (
                <tr key={d.id}>
                  <td>#{d.id}</td>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.license_number}</td>
                  <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>No drivers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Truck Modal */}
      {isTruckModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Add New Truck</h2>
            <form onSubmit={handleCreateTruck} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Identifier / Plate *</label>
                <input required type="text" className="input-field" style={{ margin: 0 }} value={truckForm.identifier} onChange={e => setTruckForm({...truckForm, identifier: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Capacity (lbs) *</label>
                <input required type="number" min="1" className="input-field" style={{ margin: 0 }} value={truckForm.capacity} onChange={e => setTruckForm({...truckForm, capacity: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Current Location</label>
                <input type="text" className="input-field" style={{ margin: 0 }} value={truckForm.current_location} onChange={e => setTruckForm({...truckForm, current_location: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsTruckModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Truck'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Driver Modal */}
      {isDriverModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Add New Driver</h2>
            <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Full Name *</label>
                <input required type="text" className="input-field" style={{ margin: 0 }} value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>License Number *</label>
                <input required type="text" className="input-field" style={{ margin: 0 }} value={driverForm.license_number} onChange={e => setDriverForm({...driverForm, license_number: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsDriverModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Driver'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
