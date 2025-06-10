import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO, startOfMonth } from 'date-fns'
import { useFilters } from '../contexts/FilterContext'

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'];

function MaintainerActivityTimeline({ data }) {
  const { isContributorActive, activeOnly, filterPRsByRecency, meetsMinimumPRs } = useFilters();
  
  // Get top maintainers across all repos
  const getTopMaintainers = () => {
    const maintainerPRs = {};
    const allPRs = [...data.witness, ...data.goWitness, ...data.archivista];
    
    Object.entries(data).forEach(([repo, prs]) => {
      prs.forEach(pr => {
        const author = pr.author?.login || 'unknown';
        if (author !== 'unknown' && !author.includes('bot') && !author.includes('app/')) {
          // Check if contributor is active (if filter is enabled)
          if (activeOnly && !isContributorActive(allPRs, author)) {
            return;
          }
          maintainerPRs[author] = (maintainerPRs[author] || 0) + 1;
        }
      });
    });
    
    return Object.entries(maintainerPRs)
      .filter(([name, count]) => meetsMinimumPRs(allPRs, name))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  };
  
  // Calculate monthly activity for each maintainer
  const calculateMaintainerActivity = () => {
    const topMaintainers = getTopMaintainers();
    const monthlyActivity = {};
    
    Object.entries(data).forEach(([repo, prs]) => {
      prs.forEach(pr => {
        const author = pr.author?.login;
        if (topMaintainers.includes(author) && pr.mergedAt) {
          const month = format(startOfMonth(parseISO(pr.mergedAt)), 'yyyy-MM');
          
          if (!monthlyActivity[month]) {
            monthlyActivity[month] = { month };
            topMaintainers.forEach(m => monthlyActivity[month][m] = 0);
          }
          
          monthlyActivity[month][author]++;
        }
      });
    });
    
    // Sort by month and fill gaps
    const months = Object.keys(monthlyActivity).sort();
    const filledData = [];
    
    if (months.length > 0) {
      const startDate = parseISO(months[0] + '-01');
      const endDate = parseISO(months[months.length - 1] + '-01');
      
      let currentDate = startOfMonth(startDate);
      while (currentDate <= endDate) {
        const monthStr = format(currentDate, 'yyyy-MM');
        if (monthlyActivity[monthStr]) {
          filledData.push(monthlyActivity[monthStr]);
        } else {
          const emptyMonth = { month: monthStr };
          topMaintainers.forEach(m => emptyMonth[m] = 0);
          filledData.push(emptyMonth);
        }
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      }
    }
    
    return { data: filledData.slice(-24), maintainers: topMaintainers }; // Last 24 months
  };
  
  const { data: chartData, maintainers } = calculateMaintainerActivity();
  
  // Custom tooltip to show activity details
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, entry) => sum + entry.value, 0);
      return (
        <div className="custom-tooltip">
          <p className="label">{`Month: ${label}`}</p>
          <p className="total">{`Total PRs: ${total}`}</p>
          {payload
            .sort((a, b) => b.value - a.value)
            .filter(entry => entry.value > 0)
            .map((entry, index) => (
              <p key={index} style={{ color: entry.color }}>
                {`${entry.name}: ${entry.value} PRs`}
              </p>
            ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="maintainer-timeline">
      <p className="chart-description">
        Monthly PR activity for the top 8 contributors. Gaps in lines indicate periods of inactivity.
      </p>
      <ResponsiveContainer width="100%" height={500}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="month" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            interval="preserveStartEnd"
          />
          <YAxis label={{ value: 'PRs Merged', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {maintainers.map((maintainer, index) => (
            <Line
              key={maintainer}
              type="monotone"
              dataKey={maintainer}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MaintainerActivityTimeline;