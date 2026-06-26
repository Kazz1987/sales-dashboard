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

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const UPLOAD_URL = `${BASE_URL}/upload-csv`
const ANALYZE_URL = `${BASE_URL}/analyze`

function buildSummary(kpi, monthlySales, categorySales) {
  const fmt = (n) => `¥${Number(n).toLocaleString()}`
  return [
    '【KPI】',
    `合計売上: ${fmt(kpi.total)}`,
    `平均売上: ${fmt(kpi.average)}`,
    `最大売上: ${fmt(kpi.max)}`,
    `最小売上: ${fmt(kpi.min)}`,
    '',
    '【月別売上】',
    ...monthlySales.map((m) => `${m.month}: ${fmt(m.sales)}`),
    '',
    '【カテゴリ別売上】',
    ...categorySales.map((c) => `${c.category}: ${fmt(c.sales)}`),
  ].join('\n')
}

function App() {
  const [monthlySales, setMonthlySales] = useState(null)
  const [categorySales, setCategorySales] = useState(null)
  const [kpi, setKpi] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(null)
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false)

  async function handleFileSelect(file) {
    setIsLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
      if (!res.ok) {
        throw new Error(`Upload failed (${res.status})`)
      }
      const data = await res.json()
      setMonthlySales(data.monthly_sales)
      setCategorySales(data.category_sales)
      setKpi(data.kpi)
      setAnalysisResult(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAnalyze() {
    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)
    setIsAnalysisOpen(true)

    const summary = buildSummary(kpi, monthlySales, categorySales)

    try {
      const res = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      if (!res.ok) {
        throw new Error(`Analysis failed (${res.status})`)
      }
      const data = await res.json()
      setAnalysisResult(data.analysis)
    } catch (err) {
      setAnalysisError(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const hasData = monthlySales && categorySales && kpi

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Sales Dashboard</h1>
        <div className="header-actions">
          {hasData && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              AI分析
            </button>
          )}
          <button type="button" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            Upload CSV
          </button>
        </div>
      </header>

      {isModalOpen && (
        <UploadModal onClose={() => setIsModalOpen(false)} onFileSelect={handleFileSelect} />
      )}

      {isAnalysisOpen && (
        <div className="modal-overlay" onClick={() => setIsAnalysisOpen(false)}>
          <div className="modal-card analysis-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setIsAnalysisOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>AI分析</h2>
            {isAnalyzing && (
              <div className="analysis-spinner-wrap">
                <span className="spinner" aria-label="分析中" />
                <p>分析中...</p>
              </div>
            )}
            {analysisError && (
              <p className="status-message error">{analysisError}</p>
            )}
            {analysisResult && (
              <div className="analysis-result">{analysisResult}</div>
            )}
          </div>
        </div>
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
