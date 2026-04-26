const DISORDERS = [
  { name: 'No Disorder', color: '#22c55e' },
  { name: 'Single Gene Disorder', color: '#3b82f6' },
  { name: 'Chromosomal Disorder', color: '#a855f7' },
  { name: 'Multifactorial Disorder', color: '#f97316' },
  { name: 'Mitochondrial Disorder', color: '#ef4444' },
]

export default function ResultsPanel({ result }) {
  if (!result) {
    return (
      <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>📊</div>
        <div style={{ color: '#64748b' }}>No results yet — go to Predict tab to run an analysis</div>
      </div>
    )
  }

  return (
    <div>
      {/* Main result card */}
      <div style={s.card}>
        <div style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px' }}>
          🎯 Prediction: <span style={{ color: DISORDERS[result.cls].color }}>{result.disorder}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
          <div style={s.stat}>
            <div style={s.statLabel}>CONFIDENCE</div>
            <div style={{ ...s.statValue, color: DISORDERS[result.cls].color }}>
              {(result.confidence * 100).toFixed(1)}%
            </div>
          </div>
          <div style={s.stat}>
            <div style={s.statLabel}>MARKERS ANALYZED</div>
            <div style={{ ...s.statValue, color: '#60a5fa' }}>50</div>
          </div>
          <div style={s.stat}>
            <div style={s.statLabel}>RISK SCORE</div>
            <div style={{ ...s.statValue, color: '#f472b6' }}>
              {(result.confidence * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Probability Distribution */}
        <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Probability Distribution</div>
        {DISORDERS.map((d, i) => (
          <div key={i} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: i === result.cls ? 'white' : '#94a3b8', fontWeight: i === result.cls ? '700' : '400' }}>
                {d.name}
              </span>
              <span style={{ color: d.color, fontWeight: '700' }}>
                {(result.probs[i] * 100).toFixed(1)}%
              </span>
            </div>
            <div style={s.barWrap}>
              <div style={{
                height: '100%', width: (result.probs[i] * 100) + '%',
                background: d.color, borderRadius: '6px',
                transition: 'width 1s ease',
              }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* SHAP Feature Importance */}
      {result.topFeatures && result.topFeatures.length > 0 && (
        <div style={s.card}>
          <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
            🔍 Key Contributing Factors (SHAP)
          </div>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
            Top genetic markers and features that influenced this prediction
          </div>
          {result.topFeatures.map((f, i) => {
            const maxImp = result.topFeatures[0].importance || 1
            const pct = (f.importance / maxImp) * 100
            return (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                    {f.feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span style={{ color: '#8b5cf6', fontWeight: '700', fontSize: '14px' }}>
                    {f.importance.toFixed(4)}
                  </span>
                </div>
                <div style={s.barWrap}>
                  <div style={{
                    height: '100%', width: pct + '%',
                    background: 'linear-gradient(90deg, #8b5cf6, #c084fc)',
                    borderRadius: '6px', transition: 'width 0.8s ease',
                  }}></div>
                </div>
              </div>
            )
          })}
        </div>
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
  stat: {
    background: 'rgba(255,255,255,0.08)', borderRadius: '14px',
    padding: '20px', textAlign: 'center',
  },
  statLabel: { color: '#94a3b8', fontSize: '13px', marginBottom: '6px' },
  statValue: { fontSize: '36px', fontWeight: '800' },
  barWrap: {
    height: '10px', background: 'rgba(255,255,255,0.1)',
    borderRadius: '6px', overflow: 'hidden', marginTop: '4px',
  },
}
