import { useState, useEffect } from 'react'
import { FilterProvider } from './contexts/FilterContext'
import FilterControls from './components/FilterControls'
import ContributorChart from './components/ContributorChart'
import TimelineChart from './components/TimelineChart'
import RepoComparison from './components/RepoComparison'
import MaintainerActivityTimeline from './components/MaintainerActivityTimeline'
import MaintainerHealthIndicators from './components/MaintainerHealthIndicators'
import PRMetrics from './components/PRMetrics'
import './App.css'

function App() {
  const [prData, setPrData] = useState({
    witness: [],
    goWitness: [],
    archivista: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [witnessData, goWitnessData, archivistaData] = await Promise.all([
          fetch('/data/witness-prs.json').then(r => r.json()),
          fetch('/data/go-witness-prs.json').then(r => r.json()),
          fetch('/data/archivista-prs.json').then(r => r.json())
        ])
        
        // Add repo field to each PR for easier processing
        setPrData({
          witness: witnessData.map(pr => ({ ...pr, repo: 'witness' })),
          goWitness: goWitnessData.map(pr => ({ ...pr, repo: 'go-witness' })),
          archivista: archivistaData.map(pr => ({ ...pr, repo: 'archivista' }))
        })
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="loading">Loading PR data...</div>
  }

  return (
    <FilterProvider>
      <div className="app">
        <h1>in-toto Project Health Analytics</h1>
        
        <div className="global-filters">
          <FilterControls />
        </div>
        
        <section className="chart-section">
          <h2>Pull Request Contributions by Repository</h2>
          <ContributorChart data={prData} />
        </section>

      <section className="chart-section">
        <h2>PR Activity Timeline</h2>
        <TimelineChart data={prData} />
      </section>

      <section className="chart-section">
        <h2>Repository Comparison</h2>
        <RepoComparison data={prData} />
      </section>

      <section className="chart-section highlight">
        <h2>Maintainer Activity Timeline</h2>
        <p className="section-description">
          Track individual maintainer contributions over time to identify capacity changes and potential burnout risks.
        </p>
        <MaintainerActivityTimeline data={prData} />
      </section>

      <section className="chart-section highlight">
        <h2>Maintainer Health Indicators</h2>
        <p className="section-description">
          Comprehensive health assessment based on activity, consistency, workload diversity, and sustainability metrics.
        </p>
        <MaintainerHealthIndicators data={prData} />
      </section>

      <section className="chart-section">
        <h2>PR Lifecycle Metrics</h2>
        <p className="section-description">
          Analysis of pull request velocity including time to merge and responsiveness metrics.
        </p>
        <PRMetrics data={prData} />
      </section>
      </div>
    </FilterProvider>
  )
}

export default App
