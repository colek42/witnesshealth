import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

function IssueStatistics({ issueData }) {
  const [monthlyData, setMonthlyData] = useState([])
  const [overviewData, setOverviewData] = useState(null)
  
  useEffect(() => {
    if (!issueData) return
    
    // Combine monthly closed issues from all repos
    const allMonthlyData = {}
    const repos = ['witness', 'goWitness', 'archivista']
    
    repos.forEach(repo => {
      const repoData = issueData[repo]
      if (repoData?.monthlyClosed) {
        repoData.monthlyClosed.forEach(month => {
          if (!allMonthlyData[month.month]) {
            allMonthlyData[month.month] = {
              month: month.month,
              witness: 0,
              goWitness: 0,
              archivista: 0,
              total: 0
            }
          }
          allMonthlyData[month.month][repo] = month.count
          allMonthlyData[month.month].total += month.count
        })
      }
    })
    
    // Convert to array and sort by month
    const sortedMonthlyData = Object.values(allMonthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
    
    setMonthlyData(sortedMonthlyData)
    
    // Calculate overview statistics
    const overview = {
      openIssues: 0,
      closedIssues: 0,
      openPRs: 0,
      byRepo: {}
    }
    
    repos.forEach(repo => {
      const repoData = issueData[repo]
      if (repoData) {
        overview.openIssues += repoData.openIssues || 0
        overview.closedIssues += repoData.closedIssues || 0
        overview.openPRs += repoData.openPRs || 0
        overview.byRepo[repo] = {
          openIssues: repoData.openIssues || 0,
          closedIssues: repoData.closedIssues || 0,
          openPRs: repoData.openPRs || 0
        }
      }
    })
    
    setOverviewData(overview)
  }, [issueData])
  
  if (!overviewData) {
    return <div className="loading">Loading issue statistics...</div>
  }
  
  // Custom tooltip for monthly chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`Month: ${label}`}</p>
          <p style={{color: '#8B5CF6'}}>{`Witness: ${payload.find(p => p.dataKey === 'witness')?.value || 0}`}</p>
          <p style={{color: '#3B82F6'}}>{`Go-Witness: ${payload.find(p => p.dataKey === 'goWitness')?.value || 0}`}</p>
          <p style={{color: '#10B981'}}>{`Archivista: ${payload.find(p => p.dataKey === 'archivista')?.value || 0}`}</p>
          <p style={{fontWeight: 'bold'}}>{`Total: ${payload.find(p => p.dataKey === 'total')?.value || 0}`}</p>
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="issue-statistics">
      <div className="overview-grid">
        <div className="stat-card">
          <div className="stat-value">{overviewData.openIssues}</div>
          <div className="stat-label">Open Issues</div>
          <div className="stat-breakdown">
            <span>Witness: {overviewData.byRepo.witness?.openIssues || 0}</span>
            <span>Go-Witness: {overviewData.byRepo.goWitness?.openIssues || 0}</span>
            <span>Archivista: {overviewData.byRepo.archivista?.openIssues || 0}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{overviewData.closedIssues}</div>
          <div className="stat-label">Closed Issues</div>
          <div className="stat-breakdown">
            <span>Witness: {overviewData.byRepo.witness?.closedIssues || 0}</span>
            <span>Go-Witness: {overviewData.byRepo.goWitness?.closedIssues || 0}</span>
            <span>Archivista: {overviewData.byRepo.archivista?.closedIssues || 0}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{overviewData.openPRs}</div>
          <div className="stat-label">Open PRs</div>
          <div className="stat-breakdown">
            <span>Witness: {overviewData.byRepo.witness?.openPRs || 0}</span>
            <span>Go-Witness: {overviewData.byRepo.goWitness?.openPRs || 0}</span>
            <span>Archivista: {overviewData.byRepo.archivista?.openPRs || 0}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">
            {monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].total : 0}
          </div>
          <div className="stat-label">Issues Closed Last Month</div>
          <div className="stat-breakdown">
            {monthlyData.length > 0 && (
              <>
                <span>Witness: {monthlyData[monthlyData.length - 1].witness}</span>
                <span>Go-Witness: {monthlyData[monthlyData.length - 1].goWitness}</span>
                <span>Archivista: {monthlyData[monthlyData.length - 1].archivista}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="monthly-chart">
        <h4>Issues Closed by Month</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis label={{ value: 'Issues Closed', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="witness" stackId="a" fill="#8B5CF6" name="Witness" />
            <Bar dataKey="goWitness" stackId="a" fill="#3B82F6" name="Go-Witness" />
            <Bar dataKey="archivista" stackId="a" fill="#10B981" name="Archivista" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <style jsx>{`
        .issue-statistics {
          width: 100%;
        }
        
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }
        
        .stat-breakdown {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.85rem;
          color: #6b7280;
        }
        
        .monthly-chart h4 {
          text-align: center;
          margin-bottom: 1rem;
          color: #4b5563;
        }
      `}</style>
    </div>
  )
}

export default IssueStatistics