import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { useFilters } from '../contexts/FilterContext'

function ReviewContributions({ reviewData }) {
  const [topReviewers, setTopReviewers] = useState([])
  const [topCommenters, setTopCommenters] = useState([])
  const [view, setView] = useState('reviews') // 'reviews' or 'comments'
  const { isContributorActive, activeOnly, meetsMinimumPRs } = useFilters()
  
  useEffect(() => {
    if (!reviewData) return
    
    // Combine review data from all repos
    const allReviewers = {}
    const allCommenters = {}
    const repos = ['witness', 'goWitness', 'archivista']
    
    repos.forEach(repo => {
      const repoData = reviewData[repo]
      if (!repoData) return
      
      // Aggregate reviewers
      if (repoData.reviewerStats) {
        repoData.reviewerStats.forEach(reviewer => {
          const name = reviewer.reviewer
          // Filter out bots
          if (name.includes('bot') || name.includes('app/') || name === 'unknown' || name === 'netlify') return
          
          if (!allReviewers[name]) {
            allReviewers[name] = { name, total: 0, byRepo: {} }
          }
          allReviewers[name].total += reviewer.totalReviews
          allReviewers[name].byRepo[repo] = reviewer.totalReviews
        })
      }
      
      // Aggregate commenters
      if (repoData.commenterStats) {
        repoData.commenterStats.forEach(commenter => {
          const name = commenter.commenter
          // Filter out bots
          if (name.includes('bot') || name.includes('app/') || name === 'unknown' || name === 'netlify') return
          
          if (!allCommenters[name]) {
            allCommenters[name] = { name, total: 0, byRepo: {} }
          }
          allCommenters[name].total += commenter.totalComments
          allCommenters[name].byRepo[repo] = commenter.totalComments
        })
      }
    })
    
    // Sort and get top reviewers
    const sortedReviewers = Object.values(allReviewers)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map(reviewer => ({
        name: reviewer.name,
        witness: reviewer.byRepo.witness || 0,
        goWitness: reviewer.byRepo.goWitness || 0,
        archivista: reviewer.byRepo.archivista || 0,
        total: reviewer.total
      }))
    
    // Sort and get top commenters
    const sortedCommenters = Object.values(allCommenters)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map(commenter => ({
        name: commenter.name,
        witness: commenter.byRepo.witness || 0,
        goWitness: commenter.byRepo.goWitness || 0,
        archivista: commenter.byRepo.archivista || 0,
        total: commenter.total
      }))
    
    setTopReviewers(sortedReviewers)
    setTopCommenters(sortedCommenters)
  }, [reviewData, activeOnly, isContributorActive, meetsMinimumPRs])
  
  const chartData = view === 'reviews' ? topReviewers : topCommenters
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0)
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          <p style={{fontWeight: 'bold'}}>Total: {total}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{color: entry.color}}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="review-contributions">
      <div className="view-controls">
        <button 
          className={view === 'reviews' ? 'active' : ''}
          onClick={() => setView('reviews')}
        >
          Code Reviews
        </button>
        <button 
          className={view === 'comments' ? 'active' : ''}
          onClick={() => setView('comments')}
        >
          PR Comments
        </button>
      </div>
      
      <div className="chart-container">
        <h4>Top {view === 'reviews' ? 'Code Reviewers' : 'PR Commenters'}</h4>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={chartData} 
            layout="horizontal"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="witness" stackId="a" fill="#8B5CF6" name="Witness" />
            <Bar dataKey="goWitness" stackId="a" fill="#3B82F6" name="Go-Witness" />
            <Bar dataKey="archivista" stackId="a" fill="#10B981" name="Archivista" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="insights">
        <h4>Review Activity Insights</h4>
        <ul>
          <li>
            Top reviewer: <strong>{topReviewers[0]?.name || 'N/A'}</strong> with {topReviewers[0]?.total || 0} reviews
          </li>
          <li>
            Top commenter: <strong>{topCommenters[0]?.name || 'N/A'}</strong> with {topCommenters[0]?.total || 0} comments
          </li>
          <li>
            Active reviewers: {topReviewers.filter(r => r.total > 5).length} contributors with 5+ reviews
          </li>
          <li>
            Review distribution: {
              topReviewers.slice(0, 3).reduce((sum, r) => sum + r.total, 0)
            } reviews ({
              Math.round((topReviewers.slice(0, 3).reduce((sum, r) => sum + r.total, 0) / 
                topReviewers.reduce((sum, r) => sum + r.total, 0)) * 100) || 0
            }%) from top 3 reviewers
          </li>
        </ul>
      </div>
      
      <style jsx>{`
        .review-contributions {
          width: 100%;
        }
        
        .view-controls {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-content: center;
        }
        
        .view-controls button {
          padding: 0.5rem 1.5rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .view-controls button:hover {
          background: #f3f4f6;
        }
        
        .view-controls button.active {
          background: #8B5CF6;
          color: white;
          border-color: #8B5CF6;
        }
        
        .chart-container h4 {
          text-align: center;
          margin-bottom: 1rem;
          color: #1a1a1a;
        }
        
        .insights {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f3f4f6;
          border-radius: 8px;
        }
        
        .insights h4 {
          margin-bottom: 1rem;
          color: #1a1a1a;
        }
        
        .insights ul {
          list-style: disc;
          padding-left: 1.5rem;
        }
        
        .insights li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }
        
        .insights strong {
          color: #1a1a1a;
        }
      `}</style>
    </div>
  )
}

export default ReviewContributions