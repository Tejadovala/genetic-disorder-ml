import { useState, useEffect } from 'react'

const API = 'http://localhost:5000/api'

export default function StatsPanel() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetch(API + '/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  if (!stats) return null

  const disorders = stats.disorder_distribution || {}
  const total = stats.total_predictions || 1

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Predictions" value={stats.total_predictions} icon="🧬" color="#3b82f6" />
        <StatCard label="Registered Users" value={stats.total_users} icon="👨‍⚕️" color="#8b5cf6" />
        <StatCard label="Avg Confidence" value={(stats.average_confidence * 100).toFixed(1) + '%'} icon="📊" color="#22c55e" />
        <StatCard label="Disorders Tracked" value={Object.keys(disorders).length} icon="🔍" color="#f97316" />
      </div>

      {/* Disorder distribution */}
      <div style={s.card}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          📈 Disorder Distribution
        </div>
        {Object.entries(disorders).map(([name, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          const colors = {
            'No Disorder': '#22c55e',
            'Single Gene Disorder': '#3b82f6',
            'Chromosomal Disorder': '#a855f7',
            'Multifactorial Disorder': '#f97316',
            'Mitochondrial Disorder': '#ef4444',
          }
          return (
            <div key={name} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{name}</span>
                <span style={{ color: colors[name] || '#94a3b8', fontWeight: '700' }}>
                  {count} ({pct.toFixed(1)}%)
                </span>
              </div>
              <div style={s.barWrap}>
                <div style={{
                  height: '100%', width: pct + '%',
                  background: colors[name] || '#94a3b8',
                  borderRadius: '6px', transition: 'width 1s ease',
                }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
      borderRadius: '16px', padding: '24px', textAlign: 'center',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '800', color, marginBottom: '4px' }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

const s = {
  card: {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
    borderRadius: '20px', padding: '28px',
    border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px',
  },
  barWrap: {
    height: '10px', background: 'rgba(255,255,255,0.1)',
    borderRadius: '6px', overflow: 'hidden',
  },
}
