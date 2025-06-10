import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

function RepoComparison({ data }) {
  // Filter out bot PRs for accurate counts
  const filterHumanPRs = (prs) => {
    return prs.filter(pr => {
      const author = pr.author?.login || 'unknown'
      return author !== 'unknown' && !author.includes('bot') && !author.includes('app/')
    })
  }
  
  const humanPRs = {
    witness: filterHumanPRs(data.witness),
    goWitness: filterHumanPRs(data.goWitness),
    archivista: filterHumanPRs(data.archivista)
  }
  
  const totalPRs = [
    { name: 'witness', value: humanPRs.witness.length, color: '#8884d8' },
    { name: 'go-witness', value: humanPRs.goWitness.length, color: '#82ca9d' },
    { name: 'archivista', value: humanPRs.archivista.length, color: '#ffc658' }
  ]
  
  const getContributorStats = () => {
    const uniqueContributors = new Set()
    
    data.witness.forEach(pr => uniqueContributors.add(pr.author?.login))
    data.goWitness.forEach(pr => uniqueContributors.add(pr.author?.login))
    data.archivista.forEach(pr => uniqueContributors.add(pr.author?.login))
    
    // Remove dependabot and other bots
    const humanContributors = Array.from(uniqueContributors).filter(
      c => c && !c.includes('bot') && !c.includes('app/')
    )
    
    return {
      total: uniqueContributors.size,
      human: humanContributors.length,
      bots: uniqueContributors.size - humanContributors.length
    }
  }
  
  const stats = getContributorStats()
  
  return (
    <div className="repo-comparison">
      <div className="charts-row">
        <div className="chart-container">
          <h3>Total PRs by Repository</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={totalPRs}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {totalPRs.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="stats-container">
          <h3>Overall Statistics</h3>
          <div className="stat-card">
            <div className="stat-value">{humanPRs.witness.length + humanPRs.goWitness.length + humanPRs.archivista.length}</div>
            <div className="stat-label">Total Human PRs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.human}</div>
            <div className="stat-label">Human Contributors</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{Math.round((humanPRs.witness.length + humanPRs.goWitness.length + humanPRs.archivista.length) / stats.human)}</div>
            <div className="stat-label">Avg PRs/Contributor</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{data.witness.length + data.goWitness.length + data.archivista.length - (humanPRs.witness.length + humanPRs.goWitness.length + humanPRs.archivista.length)}</div>
            <div className="stat-label">Bot PRs Excluded</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RepoComparison