import { useState } from 'react'
import KpiCard from './components/KpiCard'
import UploadModal from './components/UploadModal'
import {
  MonthlyLineChart,
  CategoryBarChart,
  CategoryPieChart,
  SalesTable,
} from './components/SalesChart'
import './App.css'

const API_URL = 'http://127.0.0.1:8001/upload-csv'

function App() {
  const [monthlySales, setMonthlySales] = useState(null)
  const [categorySales, setCategorySales] = useState(null)
  const [kpi, setKpi] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFileSelect(file) {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(API_URL, { method: 'POST', body: formData })
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`)
      }
      const data = await res.json()
      setMonthlySales(data.monthly_sales)
      setCategorySales(data.category_sales)
      setKpi(data.kpi)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const hasData = monthlySales && categorySales && kpi

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
          Upload CSV
        </button>
      </header>

      {isModalOpen && (
        <UploadModal onClose={() => setIsModalOpen(false)} onFileSelect={handleFileSelect} />
      )}

      {isLoading && <p className="status-message">Loading...</p>}
      {error && <p className="status-message error">{error}</p>}

      {!isLoading && !error && !hasData && (
        <p className="status-message">Upload a CSV to get started</p>
      )}

      {hasData && (
        <>
          <section className="kpi-row">
            <KpiCard label="Total Sales" value={kpi.total} />
            <KpiCard label="Average" value={kpi.average} />
            <KpiCard label="Max" value={kpi.max} />
            <KpiCard label="Min" value={kpi.min} />
          </section>

          <section className="chart-grid">
            <div className="chart-card">
              <h2>Monthly Sales</h2>
              <MonthlyLineChart data={monthlySales} />
            </div>
            <div className="chart-card">
              <h2>Category Sales</h2>
              <CategoryBarChart data={categorySales} />
            </div>
            <div className="chart-card">
              <h2>Sales Ratio</h2>
              <CategoryPieChart data={categorySales} />
            </div>
            <div className="chart-card">
              <h2>Data Table</h2>
              <SalesTable data={monthlySales} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default App
