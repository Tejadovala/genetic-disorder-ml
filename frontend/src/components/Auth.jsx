import { useState } from 'react'

const API = 'http://localhost:5000/api'

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'doctor' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const endpoint = isLogin ? '/login' : '/register'
      const body = isLogin
        ? { username: form.username, password: form.password }
        : { ...form }
      const res = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Auth failed')
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      onLogin(data.user, data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Decorative orbs */}
        <div style={styles.orb1}></div>
        <div style={styles.orb2}></div>

        <div style={styles.card}>
          <div style={styles.logo}>🧬</div>
          <h1 style={styles.title}>Genetic Disorder Predictor</h1>
          <p style={styles.subtitle}>AI-Powered Genetic Health Assessment</p>

          <div style={styles.toggleRow}>
            <button
              style={isLogin ? styles.toggleActive : styles.toggleInactive}
              onClick={() => setIsLogin(true)}
            >Sign In</button>
            <button
              style={!isLogin ? styles.toggleActive : styles.toggleInactive}
              onClick={() => setIsLogin(false)}
            >Register</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            {!isLogin && (
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {!isLogin && (
              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <select
                  style={styles.input}
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="doctor">Doctor</option>
                  <option value="researcher">Researcher</option>
                  <option value="student">Student</option>
                </select>
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              {loading ? '⏳ Please wait...' : isLogin ? '🔐 Sign In' : '🚀 Create Account'}
            </button>
          </form>

          <p style={styles.footer}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span style={styles.link} onClick={() => { setIsLogin(!isLogin); setError(null) }}>
              {isLogin ? 'Register here' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #2d0a2e 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', position: 'relative', overflow: 'hidden',
  },
  container: { position: 'relative', width: '100%', maxWidth: '460px', zIndex: 1 },
  orb1: {
    position: 'fixed', width: '400px', height: '400px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)',
    top: '-100px', right: '-100px', pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', width: '350px', height: '350px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)',
    bottom: '-80px', left: '-80px', pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)',
    borderRadius: '24px', padding: '40px 36px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
  },
  logo: { fontSize: '56px', textAlign: 'center', marginBottom: '8px' },
  title: {
    fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '6px',
    background: 'linear-gradient(90deg, #60a5fa, #c084fc, #f472b6)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  subtitle: { textAlign: 'center', color: '#94a3b8', fontSize: '14px', marginBottom: '28px' },
  toggleRow: {
    display: 'flex', gap: '8px', marginBottom: '24px',
    background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px',
  },
  toggleActive: {
    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', fontWeight: '700', fontSize: '14px',
    background: 'white', color: '#1e1b4b',
  },
  toggleInactive: {
    flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', fontWeight: '600', fontSize: '14px',
    background: 'transparent', color: '#94a3b8',
  },
  field: { marginBottom: '16px' },
  label: {
    display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600',
  },
  input: {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', fontSize: '15px', outline: 'none',
    transition: 'border 0.2s',
  },
  error: {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '10px', padding: '10px 14px', color: '#fca5a5',
    fontSize: '13px', marginBottom: '16px',
  },
  submitBtn: {
    width: '100%', padding: '16px', border: 'none', borderRadius: '14px',
    fontSize: '16px', fontWeight: '700', cursor: 'pointer', color: 'white',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    transition: 'transform 0.15s',
  },
  footer: {
    textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px',
  },
  link: { color: '#8b5cf6', cursor: 'pointer', fontWeight: '600' },
}
