import { useState, useEffect } from 'react'
import { FilterProvider } from './contexts/FilterContext'
import FilterControls from './components/FilterControls'
import ContributorChart from './components/ContributorChart'
import TimelineChart from './components/TimelineChart'
import RepoComparison from './components/RepoComparison'
import MaintainerActivityTimeline from './components/MaintainerActivityTimeline'
import MaintainerHealthIndicators from './components/MaintainerHealthIndicators'
import PRMetrics from './components/PRMetrics'
import IssueStatistics from './components/IssueStatistics'
import ReviewContributions from './components/ReviewContributions'
import './App.css'

function App() {
  const [prData, setPrData] = useState({
    witness: [],
    goWitness: [],
    archivista: []
  })
  const [issueData, setIssueData] = useState({
    witness: null,
    goWitness: null,
    archivista: null
  })
  const [reviewData, setReviewData] = useState({
    witness: null,
    goWitness: null,
    archivista: null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch PR data
        const [witnessData, goWitnessData, archivistaData] = await Promise.all([
          fetch('/witnesshealth/data/witness-prs.json').then(r => r.json()),
          fetch('/witnesshealth/data/go-witness-prs.json').then(r => r.json()),
          fetch('/witnesshealth/data/archivista-prs.json').then(r => r.json())
        ])
        
        // Add repo field to each PR for easier processing
        setPrData({
          witness: witnessData.map(pr => ({ ...pr, repo: 'witness' })),
          goWitness: goWitnessData.map(pr => ({ ...pr, repo: 'go-witness' })),
          archivista: archivistaData.map(pr => ({ ...pr, repo: 'archivista' }))
        })
        
        // Try to fetch issue data (may not exist yet)
        try {
          const [witnessIssues, goWitnessIssues, archivistaIssues] = await Promise.all([
            fetch('/witnesshealth/data/witness-issues.json').then(r => r.json()),
            fetch('/witnesshealth/data/go-witness-issues.json').then(r => r.json()),
            fetch('/witnesshealth/data/archivista-issues.json').then(r => r.json())
          ])
          
          setIssueData({
            witness: witnessIssues,
            goWitness: goWitnessIssues,
            archivista: archivistaIssues
          })
        } catch (e) {
          console.log('Issue data not available yet')
        }
        
        // Try to fetch review data (may not exist yet)
        try {
          const [witnessReviews, goWitnessReviews, archivistaReviews] = await Promise.all([
            fetch('/witnesshealth/data/witness-reviews.json').then(r => r.json()),
            fetch('/witnesshealth/data/go-witness-reviews.json').then(r => r.json()),
            fetch('/witnesshealth/data/archivista-reviews.json').then(r => r.json())
          ])
          
          setReviewData({
            witness: witnessReviews,
            goWitness: goWitnessReviews,
            archivista: archivistaReviews
          })
        } catch (e) {
          console.log('Review data not available yet')
        }
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

      <section className="chart-section">
        <h2>Issue & PR Backlog Statistics</h2>
        <p className="section-description">
          Current state of open issues and pull requests across all repositories.
        </p>
        <IssueStatistics issueData={issueData} />
      </section>

      <section className="chart-section">
        <h2>Review Contributions</h2>
        <p className="section-description">
          Track who is providing the most code reviews and PR comments to identify key reviewers.
        </p>
        <ReviewContributions reviewData={reviewData} />
      </section>
      </div>
    </FilterProvider>
  )
}

export default App
