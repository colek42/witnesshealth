import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, parseISO, differenceInHours, differenceInDays, startOfMonth } from 'date-fns'
import { useState } from 'react'

function PRMetrics({ data }) {
  const [view, setView] = useState('timeToMerge'); // 'timeToMerge' or 'timeToFirstComment'
  
  // Calculate PR metrics
  const calculateMetrics = () => {
    const allPRs = [...data.witness, ...data.goWitness, ...data.archivista];
    // Filter for merged PRs from humans only
    const mergedPRs = allPRs.filter(pr => {
      const author = pr.author?.login || 'unknown';
      const isBot = author.includes('bot') || author.includes('app/') || author === 'unknown';
      return pr.mergedAt && pr.createdAt && !isBot;
    });
    
    // Monthly averages
    const monthlyMetrics = {};
    
    mergedPRs.forEach(pr => {
      const created = parseISO(pr.createdAt);
      const merged = parseISO(pr.mergedAt);
      const month = format(startOfMonth(merged), 'yyyy-MM');
      
      if (!monthlyMetrics[month]) {
        monthlyMetrics[month] = {
          month,
          timeToMerge: [],
          timeToFirstComment: [],
          count: 0
        };
      }
      
      // Calculate time to merge in hours
      const hoursToMerge = differenceInHours(merged, created);
      monthlyMetrics[month].timeToMerge.push(hoursToMerge);
      monthlyMetrics[month].count++;
      
      // Time to first comment (if available in PR data)
      if (pr.firstInteraction) {
        const firstInteraction = parseISO(pr.firstInteraction);
        const hoursToFirstComment = differenceInHours(firstInteraction, created);
        monthlyMetrics[month].timeToFirstComment.push(hoursToFirstComment);
      }
    });
    
    // Calculate averages and convert to days
    const chartData = Object.values(monthlyMetrics)
      .map(month => ({
        month: month.month,
        avgTimeToMerge: (month.timeToMerge.reduce((a, b) => a + b, 0) / month.timeToMerge.length / 24).toFixed(1),
        avgTimeToFirstComment: month.timeToFirstComment.length > 0 
          ? (month.timeToFirstComment.reduce((a, b) => a + b, 0) / month.timeToFirstComment.length / 24).toFixed(1)
          : null,
        prCount: month.count,
        commentCount: month.timeToFirstComment.length,
        medianTimeToMerge: (month.timeToMerge.sort((a, b) => a - b)[Math.floor(month.timeToMerge.length / 2)] / 24).toFixed(1)
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
    
    // Distribution data
    const distributionData = calculateDistribution(mergedPRs);
    
    return { chartData, distributionData };
  };
  
  const calculateDistribution = (mergedPRs) => {
    const bins = [
      { name: '<1 day', min: 0, max: 24, count: 0 },
      { name: '1-3 days', min: 24, max: 72, count: 0 },
      { name: '3-7 days', min: 72, max: 168, count: 0 },
      { name: '1-2 weeks', min: 168, max: 336, count: 0 },
      { name: '2-4 weeks', min: 336, max: 672, count: 0 },
      { name: '>4 weeks', min: 672, max: Infinity, count: 0 }
    ];
    
    mergedPRs.forEach(pr => {
      const hours = differenceInHours(parseISO(pr.mergedAt), parseISO(pr.createdAt));
      const bin = bins.find(b => hours >= b.min && hours < b.max);
      if (bin) bin.count++;
    });
    
    return bins.map(bin => ({
      ...bin,
      percentage: ((bin.count / mergedPRs.length) * 100).toFixed(1)
    }));
  };
  
  const { chartData, distributionData } = calculateMetrics();
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`Month: ${label}`}</p>
          {view === 'timeToMerge' ? (
            <>
              <p>{`Avg Time to Merge: ${payload[0].value} days`}</p>
              <p>{`Median: ${payload[0].payload.medianTimeToMerge} days`}</p>
              <p>{`PRs Merged: ${payload[0].payload.prCount}`}</p>
            </>
          ) : (
            <>
              <p>{`Avg Time to First Comment: ${payload[0].value || 'No data'} days`}</p>
              <p>{`PRs with comments: ${payload[0].payload.commentCount}`}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="pr-metrics">
      <div className="metric-controls">
        <button 
          className={view === 'timeToMerge' ? 'active' : ''}
          onClick={() => setView('timeToMerge')}
        >
          Time to Merge
        </button>
        <button 
          className={view === 'timeToFirstComment' ? 'active' : ''}
          onClick={() => setView('timeToFirstComment')}
        >
          Time to First Comment
        </button>
      </div>
      
      <div className="metrics-content">
        <div className="timeline-chart">
          <h4>Average {view === 'timeToMerge' ? 'Time to Merge' : 'Time to First Comment'} (Days)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey={view === 'timeToMerge' ? 'avgTimeToMerge' : 'avgTimeToFirstComment'} 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {view === 'timeToMerge' && (
          <div className="distribution-chart">
            <h4>Time to Merge Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Number of PRs', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value, name) => [`${value} PRs`, 'Count']} />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
            <div className="distribution-summary">
              {distributionData.map(bin => (
                <div key={bin.name} className="dist-item">
                  <span className="dist-label">{bin.name}:</span>
                  <span className="dist-value">{bin.percentage}% ({bin.count} PRs)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="metrics-insights">
        <h4>Key Insights</h4>
        <ul>
          <li>Average time to merge: {chartData.length > 0 ? chartData[chartData.length - 1].avgTimeToMerge : 'N/A'} days (last month)</li>
          <li>Most PRs ({distributionData.reduce((max, bin) => bin.count > max.count ? bin : max, distributionData[0]).percentage}%) are merged within {distributionData.reduce((max, bin) => bin.count > max.count ? bin : max, distributionData[0]).name}</li>
          {view === 'timeToFirstComment' && (
            <li>Note: Time to first comment data requires running collect-pr-details.sh script for full data</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default PRMetrics;