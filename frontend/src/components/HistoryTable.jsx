import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : 'http://localhost:5000/api'

const DISORDERS = [
  { name: 'No Disorder', color: '#22c55e' },
  { name: 'Single Gene Disorder', color: '#3b82f6' },
  { name: 'Chromosomal Disorder', color: '#a855f7' },
  { name: 'Multifactorial Disorder', color: '#f97316' },
  { name: 'Mitochondrial Disorder', color: '#ef4444' },
]

export default function HistoryTable() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchHistory() }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch(API + '/history')
      const data = await res.json()
      setHistory(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    await fetch(API + '/history', { method: 'DELETE' })
    setHistory([])
  }

  if (loading) {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
        <div style={{ color: '#64748b' }}>Loading history...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: '700' }}>
          📋 Analysis History ({history.length} records)
        </div>
        {history.length > 0 && (
          <button onClick={clearHistory} style={s.clearBtn}>🗑 Clear All</button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
          <div style={{ color: '#64748b' }}>No history yet — run a prediction to see it saved here</div>
        </div>
      ) : (
        history.map((h) => (
          <div key={h.id} style={s.histCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{
                    display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                    fontSize: '13px', fontWeight: '700',
                    background: DISORDERS[h.result.predicted_class].color + '33',
                    color: DISORDERS[h.result.predicted_class].color,
                    border: '1px solid ' + DISORDERS[h.result.predicted_class].color + '66',
                  }}>
                    {h.result.predicted_disorder}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>{h.timestamp}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Age: {h.patient.age} | Gender: {h.patient.gender} | {h.patient.ethnicity} | Family History: {h.patient.familyHistory}
                </div>
                {h.patient.symptoms && h.patient.symptoms.length > 0 && (
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>
                    Symptoms: {h.patient.symptoms.join(', ')}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  color: DISORDERS[h.result.predicted_class].color,
                  fontSize: '24px', fontWeight: '800',
                }}>
                  {(h.result.confidence * 100).toFixed(1)}%
                </div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>confidence</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

const s = {
  card: {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
    borderRadius: '20px', padding: '28px',
    border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px',
  },
  histCard: {
    background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
    padding: '20px', border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '12px', transition: 'background 0.2s',
  },
  clearBtn: {
    padding: '10px 20px', background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px',
    color: '#fca5a5', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
  },
}
