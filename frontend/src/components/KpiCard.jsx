function formatYen(value) {
  return `¥${value.toLocaleString()}`
}

function KpiCard({ label, value }) {
  return (
    <div className="kpi-card">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{formatYen(value)}</p>
    </div>
  )
}

export default KpiCard
