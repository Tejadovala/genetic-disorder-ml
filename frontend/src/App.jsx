import { useState, useEffect } from 'react'
import Auth from './components/Auth'
import PredictionForm from './components/PredictionForm'
import ResultsPanel from './components/ResultsPanel'
import HistoryTable from './components/HistoryTable'
import StatsPanel from './components/StatsPanel'

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [tab, setTab] = useState('predict')
  const [result, setResult] = useState(null)

  // Restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    setResult(null)
  }

  const handleResult = (data) => {
    setResult(data)
    setTab('results')
  }

  // If not logged in, show auth screen
  if (!user) {
    return <Auth onLogin={handleLogin} />
  }

  const tabs = [
    { key: 'predict', label: '🧬 Predict' },
    { key: 'results', label: '📊 Results' },
    { key: 'history', label: '📋 History' },
    { key: 'stats', label: '📈 Stats' },
    { key: 'about', label: 'ℹ️ About' },
  ]

  return (
    <div style={s.wrap}>
      <div style={s.inner}>
        {/* Header / Navbar */}
        <div style={s.header}>
          <div>
            <div style={s.h1}>🧬 Genetic Disorder Predictor</div>
            <div style={{ color: '#94a3b8', fontSize: '16px' }}>
              AI-Powered Genetic Health Assessment
            </div>
          </div>
          <div style={s.userBar}>
            <div style={s.avatar}>{user.username[0].toUpperCase()}</div>
            <div>
              <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{user.username}</div>
              <div style={{ color: '#64748b', fontSize: '12px', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
            <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Feature badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '24px' }}>
          {['97% Accuracy', '3 ML Models', 'SHAP Explainability', 'Real-time Analysis'].map(t => (
            <span key={t} style={{ color: '#c084fc', fontSize: '13px', fontWeight: '600' }}>✦ {t}</span>
          ))}
        </div>

        {/* Tab bar */}
        <div style={s.tabs}>
          {tabs.map(t => (
            <button key={t.key}
              style={tab === t.key ? s.tabActive : s.tabInactive}
              onClick={() => setTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'predict' && <PredictionForm token={token} onResult={handleResult} />}
        {tab === 'results' && <ResultsPanel result={result} />}
        {tab === 'history' && <HistoryTable />}
        {tab === 'stats' && <StatsPanel />}
        {tab === 'about' && <AboutSection />}

        {/* Medical Disclaimer */}
        <div style={s.disclaimer}>
          ⚠️ <strong>Medical Disclaimer:</strong> This tool is for research and educational purposes only.
          Always consult qualified genetic counselors and healthcare professionals for clinical diagnosis.
        </div>
      </div>
    </div>
  )
}

function AboutSection() {
  const models = [
    { name: 'Random Forest', acc: '94.0%', desc: 'Ensemble of decision trees, robust to overfitting', icon: '🌲' },
    { name: 'Gradient Boosting', acc: '95.3%', desc: 'Sequential ensemble that corrects prior errors', icon: '📈' },
    { name: 'Neural Network', acc: '97.0%', desc: 'Multi-layer perceptron — best performing model', icon: '🧠' },
    { name: 'Auto Selection', acc: '97.0%', desc: 'Automatically picks highest-accuracy model', icon: '⚡' },
  ]

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {models.map((m, i) => (
          <div key={i} style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>{m.icon} {m.name}</div>
              <span style={{
                background: '#16a34a', color: 'white',
                padding: '4px 12px', borderRadius: '999px',
                fontSize: '13px', fontWeight: '700',
              }}>{m.acc}</span>
            </div>
            <div style={{ color: '#94a3b8' }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div style={s.card}>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>🔬 Technology Stack</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          {[
            { name: 'Flask + SQLAlchemy', desc: 'Backend API + SQLite DB' },
            { name: 'scikit-learn', desc: 'Machine Learning Models' },
            { name: 'SHAP', desc: 'Model Explainability' },
            { name: 'React + Vite', desc: 'Frontend Framework' },
            { name: 'JWT Auth', desc: 'Secure Authentication' },
            { name: 'Docker', desc: 'Containerized Deployment' },
          ].map((t, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
              padding: '16px', textAlign: 'center',
            }}>
              <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>{t.name}</div>
              <div style={{ color: '#64748b', fontSize: '12px' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #2d0a2e 100%)',
    color: 'white', padding: '32px 24px',
  },
  inner: { maxWidth: '1100px', margin: '0 auto' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '16px',
  },
  h1: {
    fontSize: '36px', fontWeight: '800',
    background: 'linear-gradient(90deg, #60a5fa, #c084fc, #f472b6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  userBar: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
    borderRadius: '16px', padding: '10px 20px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '800', fontSize: '16px',
  },
  logoutBtn: {
    padding: '6px 14px', background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
    color: '#fca5a5', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
    marginLeft: '8px',
  },
  tabs: {
    display: 'flex', gap: '8px',
    background: 'rgba(255,255,255,0.05)', borderRadius: '14px',
    padding: '6px', marginBottom: '32px',
  },
  tabActive: {
    flex: 1, padding: '14px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', fontWeight: '700', fontSize: '15px',
    transition: 'all 0.2s', background: 'white', color: '#1e1b4b',
  },
  tabInactive: {
    flex: 1, padding: '14px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', fontWeight: '600', fontSize: '15px',
    transition: 'all 0.2s', background: 'transparent', color: '#94a3b8',
  },
  card: {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
    borderRadius: '20px', padding: '28px',
    border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px',
  },
  disclaimer: {
    background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)',
    borderRadius: '12px', padding: '16px', marginTop: '24px',
    color: '#fde68a', fontSize: '13px',
  },
}
