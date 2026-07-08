import { useState, useEffect } from 'react'

export default function DispatchBoard() {
  const [loads, setLoads] = useState<any[]>([])
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState<any>(null)
  
  // Dispatch Recs State
  const [selectedLoadId, setSelectedLoadId] = useState<number | null>(null)
  const [recommendations, setRecommendations] = useState<any[] | null>(null)
  const [isFetchingRecs, setIsFetchingRecs] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('http://localhost:8000/api/v1/loads/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLoads(data))
      .catch(err => console.error(err))
  }, [])

  const handleExtract = async () => {
    setIsExtracting(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('http://localhost:8000/api/v1/loads/extract', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: aiInput })
      })
      const data = await res.json()
      setExtractedData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleGetRecommendations = async (loadId: number) => {
    setSelectedLoadId(loadId)
    setIsFetchingRecs(true)
    setRecommendations(null)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:8000/api/v1/loads/${loadId}/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsFetchingRecs(false)
    }
  }

  const parseDateString = (dateStr: string) => {
    if (!dateStr) return new Date().toISOString()
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d.toISOString()
    
    // Fallback for DD/MM/YYYY
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      const swapped = new Date(`${parts[1]}/${parts[0]}/${parts[2]}`)
      if (!isNaN(swapped.getTime())) return swapped.toISOString()
    }
    return new Date().toISOString()
  }

  const handleSaveLoad = async () => {
    if (!extractedData) return
    const token = localStorage.getItem('token')
    try {
      const payload = {
        customer_id: 1, // Defaulting to 1 for demo purposes
        pickup_location: extractedData.pickup_location || "Unknown",
        delivery_location: extractedData.delivery_location || "Unknown",
        weight: extractedData.weight || 0,
        commodity: extractedData.commodity || "General Freight",
        pickup_date: parseDateString(extractedData.pickup_date),
        delivery_deadline: parseDateString(extractedData.delivery_deadline),
        ai_summary: extractedData.ai_summary
      }
      
      const res = await fetch('http://localhost:8000/api/v1/loads/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        setIsAiModalOpen(false)
        setExtractedData(null)
        setAiInput('')
        // Refresh loads
        const updatedRes = await fetch('http://localhost:8000/api/v1/loads/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const updatedData = await updatedRes.json()
        setLoads(updatedData)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAssign = async (truckId: number, driverId: number) => {
    if (!selectedLoadId) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:8000/api/v1/loads/${selectedLoadId}/assign`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ truck_id: truckId, driver_id: driverId })
      })
      if (res.ok) {
        setSelectedLoadId(null)
        // Refresh loads
        const updatedRes = await fetch('http://localhost:8000/api/v1/loads/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const updatedData = await updatedRes.json()
        setLoads(updatedData)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div className="header">
        <h1>Dispatch Board</h1>
        <button className="btn" onClick={() => setIsAiModalOpen(true)}>✨ New AI Load</button>
      </div>

      <div className="data-table-container glass-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Pickup</th>
              <th>Delivery</th>
              <th>Date</th>
              <th>Status</th>
              <th>AI Summary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loads.map(load => (
              <tr key={load.id}>
                <td>#{load.id}</td>
                <td>{load.pickup_location}</td>
                <td>{load.delivery_location}</td>
                <td>{new Date(load.pickup_date).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge status-${load.status}`}>
                    {load.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '300px' }}>
                  {load.ai_summary || '-'}
                </td>
                <td>
                  {load.status === 'PENDING' && (
                    <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => handleGetRecommendations(load.id)}>
                      AI Dispatch
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {loads.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  No loads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* AI Modal */}
      {isAiModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div className="glass-panel ai-card" style={{ padding: '2rem', width: '600px', maxWidth: '90vw' }}>
            <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✨ AI Load Extraction
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Paste an email or message below.</p>
            
            <textarea 
              className="textarea-field" 
              rows={5} 
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="e.g., We need a refrigerated truck tomorrow from Dallas to Houston... 18,500 lbs."
            />

            {extractedData && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Extracted Details:</h4>
                <pre style={{ fontSize: '0.8rem', color: 'var(--success)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
                {extractedData.validation_warnings?.length > 0 && (
                  <div style={{ marginTop: '0.5rem', color: 'var(--warning)', fontSize: '0.875rem' }}>
                    <strong>⚠️ Warnings:</strong>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      {extractedData.validation_warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => { setIsAiModalOpen(false); setExtractedData(null); setAiInput(''); }}>Cancel</button>
              <button className="btn" onClick={handleExtract} disabled={isExtracting || !aiInput.trim()}>
                {isExtracting ? 'Extracting...' : 'Extract Data'}
              </button>
              {extractedData && (
                <button className="btn" style={{ background: 'var(--success)' }} onClick={handleSaveLoad}>
                  Save Load to System
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Recommendations Modal */}
      {selectedLoadId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div className="glass-panel ai-card" style={{ padding: '2rem', width: '700px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 AI Dispatch Recommendations
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Analyzing optimal truck and driver pairings for Load #{selectedLoadId}...</p>
            
            {isFetchingRecs ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--accent-color)' }}>
                Processing logistics data with AI...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {recommendations?.map((rec, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--accent-color)', fontSize: '1.1rem' }}>Rank #{idx + 1}</strong>
                      <span className="status-badge status-ASSIGNED">Truck #{rec.truck_id} • Driver #{rec.driver_id}</span>
                    </div>
                    <p style={{ margin: '0.5rem 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>{rec.reasoning}</p>
                    
                    {rec.warning_conflict && (
                      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid var(--warning)', borderRadius: '4px' }}>
                        <strong style={{ color: 'var(--warning)', fontSize: '0.875rem' }}>⚠️ Conflict Warning: </strong>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{rec.warning_conflict}</span>
                      </div>
                    )}
                    
                    <button className="btn" style={{ marginTop: '1rem', width: '100%' }} onClick={() => handleAssign(rec.truck_id, rec.driver_id)}>
                      Assign this Combination
                    </button>
                  </div>
                ))}
                {recommendations?.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--warning)' }}>
                    No viable combinations found based on capacity and availability constraints.
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedLoadId(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
