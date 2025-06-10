import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO, startOfMonth } from 'date-fns'

function TimelineChart({ data }) {
  const processTimelineData = () => {
    const monthlyData = {}
    
    const processPRs = (prs, repo) => {
      prs.forEach(pr => {
        // Filter out bots
        const author = pr.author?.login || 'unknown'
        if (author.includes('bot') || author.includes('app/') || author === 'unknown') {
          return
        }
        
        if (pr.mergedAt) {
          const month = format(startOfMonth(parseISO(pr.mergedAt)), 'yyyy-MM')
          if (!monthlyData[month]) {
            monthlyData[month] = { month, witness: 0, goWitness: 0, archivista: 0 }
          }
          monthlyData[month][repo]++
        }
      })
    }
    
    processPRs(data.witness, 'witness')
    processPRs(data.goWitness, 'goWitness')
    processPRs(data.archivista, 'archivista')
    
    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-24) // Last 24 months
  }
  
  const chartData = processTimelineData()
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="witness" stroke="#8884d8" name="witness" />
        <Line type="monotone" dataKey="goWitness" stroke="#82ca9d" name="go-witness" />
        <Line type="monotone" dataKey="archivista" stroke="#ffc658" name="archivista" />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default TimelineChart