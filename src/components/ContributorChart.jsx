import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useFilters } from '../contexts/FilterContext'

function ContributorChart({ data }) {
  const { isContributorActive, activeOnly, meetsMinimumPRs } = useFilters();
  
  // Process data to get contributor counts
  const processData = () => {
    const contributorMap = {}
    const allPRs = [...data.witness, ...data.goWitness, ...data.archivista];
    
    const addContributors = (prs, repo) => {
      prs.forEach(pr => {
        const author = pr.author?.login || 'unknown'
        // Filter out bots and GitHub Actions
        if (author.includes('bot') || author.includes('app/') || author === 'unknown') {
          return
        }
        
        // Check if contributor is active (if filter is enabled)
        if (activeOnly && !isContributorActive(allPRs, author)) {
          return;
        }
        
        if (!contributorMap[author]) {
          contributorMap[author] = { name: author, witness: 0, goWitness: 0, archivista: 0 }
        }
        contributorMap[author][repo]++
      })
    }
    
    addContributors(data.witness, 'witness')
    addContributors(data.goWitness, 'goWitness')
    addContributors(data.archivista, 'archivista')
    
    return Object.values(contributorMap)
      .filter(contributor => {
        const total = contributor.witness + contributor.goWitness + contributor.archivista;
        return meetsMinimumPRs(allPRs, contributor.name);
      })
      .sort((a, b) => (b.witness + b.goWitness + b.archivista) - (a.witness + a.goWitness + a.archivista))
      .slice(0, 15) // Top 15 contributors
  }
  
  const chartData = processData()
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="witness" fill="#8884d8" name="witness" />
        <Bar dataKey="goWitness" fill="#82ca9d" name="go-witness" />
        <Bar dataKey="archivista" fill="#ffc658" name="archivista" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default ContributorChart