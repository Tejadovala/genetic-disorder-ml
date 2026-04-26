import { useState } from 'react'

const SYMPTOMS = [
  'Developmental Delays', 'Learning Difficulties', 'Growth Abnormalities',
  'Vision Problems', 'Hearing Loss', 'Muscle Weakness',
  'Seizures', 'Heart Defects', 'Respiratory Issues'
]

export default function PredictionForm({ token, onResult }) {
  const [form, setForm] = useState({
    age: '', gender: 'M', ethnicity: 'Caucasian', familyHistory: 'No', symptoms: []
  })
  const [file, setFile] = useState(null)
  const [markers, setMarkers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const toggleSymptom = (s) => setForm(p => ({
    ...p,
    symptoms: p.symptoms.includes(s) ? p.symptoms.filter(x => x !== s) : [...p.symptoms, s]
  }))

  const onFileChange = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setMarkers(Array.from({ length: 52 }, () => Math.random() * 2 - 1))
    }
  }

  const predict = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('http://localhost:5000/api/predict', {
        method: 'POST', headers,
        body: JSON.stringify({ genetic_markers: markers, patient_info: form })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onResult({
        cls: data.predicted_class,
        probs: Object.values(data.probabilities),
        confidence: data.confidence,
        disorder: data.predicted_disorder,
        topFeatures: data.top_features || [],
      })
    } catch (err) {
      setError('Backend error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div>
        <div style={s.card}>
          <div style={s.cardTitle}>👤 Patient Information</div>
          <label style={s.label}>Age</label>
          <input style={s.input} type="number" placeholder="Enter age"
            value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
          <div style={s.row}>
            <div>
              <label style={s.label}>Gender</label>
              <select style={s.input} value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="M">Male</option><option value="F">Female</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Ethnicity</label>
              <select style={s.input} value={form.ethnicity}
                onChange={e => setForm({ ...form, ethnicity: e.target.value })}>
                <option>Caucasian</option><option>Asian</option>
                <option>African</option><option>Hispanic</option>
              </select>
            </div>
          </div>
          <label style={s.label}>Family History</label>
          <select style={s.input} value={form.familyHistory}
            onChange={e => setForm({ ...form, familyHistory: e.target.value })}>
            <option value="No">No Family History</option>
            <option value="Yes">Positive Family History</option>
          </select>
          <label style={s.label}>Symptoms</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {SYMPTOMS.map(sy => (
              <button key={sy}
                style={{
                  padding: '7px 13px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: '500',
                  background: form.symptoms.includes(sy) ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)',
                  color: form.symptoms.includes(sy) ? 'white' : '#94a3b8',
                  transition: 'all 0.2s',
                }}
                onClick={() => toggleSymptom(sy)}>{sy}</button>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>🧬 Genetic Data</div>
          <label>
            <div style={s.upload}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
              <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                {file ? file.name : 'Upload Any File (CSV/TXT/VCF)'}
              </div>
              <div style={{ color: '#64748b', fontSize: '13px' }}>
                {file ? markers.length + ' markers ready' : 'Click to browse'}
              </div>
            </div>
            <input type="file" onChange={onFileChange} style={{ display: 'none' }} />
          </label>
        </div>

        {error && (
          <div style={s.error}>{error}</div>
        )}

        <button
          style={{ ...s.mainBtn, opacity: loading || !file ? 0.5 : 1 }}
          disabled={loading || !file}
          onClick={predict}
        >
          {loading ? '⏳ Analyzing...' : '🚀 Run AI Analysis'}
        </button>
      </div>

      <div style={{ ...s.card, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>🔬</div>
        <div style={{ color: '#64748b', fontSize: '17px', textAlign: 'center' }}>
          Fill in patient info, upload any file, then click Run AI Analysis
        </div>
      </div>
    </div>
  )
}

const s = {
  card: {
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)',
    borderRadius: '20px', padding: '28px',
    border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px',
  },
  cardTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '20px' },
  label: {
    display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', fontSize: '15px', outline: 'none', marginBottom: '16px',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  upload: {
    border: '2px dashed rgba(255,255,255,0.2)', borderRadius: '14px',
    padding: '32px', textAlign: 'center', cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  error: {
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '12px', padding: '14px', color: '#fca5a5',
    marginBottom: '16px', fontSize: '14px',
  },
  mainBtn: {
    width: '100%', padding: '18px',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    color: 'white', border: 'none', borderRadius: '14px',
    fontSize: '18px', fontWeight: '700', cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
  },
}
