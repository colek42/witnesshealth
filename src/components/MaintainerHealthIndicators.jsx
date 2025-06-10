import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { useFilters } from '../contexts/FilterContext'

function MaintainerHealthIndicators({ data }) {
  const [healthData, setHealthData] = useState([]);
  const [selectedMaintainer, setSelectedMaintainer] = useState('all');
  const { isContributorActive, activeOnly, activityMonths, meetsMinimumPRs, minPRs } = useFilters();
  
  useEffect(() => {
    // Calculate health indicators based on current data and filters
    const calculateHealthIndicators = () => {
      const maintainerStats = {};
      const allPRs = [...data.witness, ...data.goWitness, ...data.archivista];
      
      // Filter out bots and calculate stats for each maintainer
      allPRs.forEach(pr => {
        const author = pr.author?.login || 'unknown';
        if (author === 'unknown' || author.includes('bot') || author.includes('app/')) {
          return;
        }
        
        if (!maintainerStats[author]) {
          maintainerStats[author] = {
            name: author,
            totalPRs: 0,
            recentPRs: 0,
            monthlyActivity: {},
            repos: new Set(),
            firstPR: null,
            lastPR: null
          };
        }
        
        if (pr.mergedAt) {
          const mergeDate = new Date(pr.mergedAt);
          const month = pr.mergedAt.substring(0, 7);
          
          maintainerStats[author].totalPRs++;
          maintainerStats[author].repos.add(pr.repo || 'unknown');
          
          // Track monthly activity
          maintainerStats[author].monthlyActivity[month] = 
            (maintainerStats[author].monthlyActivity[month] || 0) + 1;
          
          // Track first and last PR
          if (!maintainerStats[author].firstPR || mergeDate < maintainerStats[author].firstPR) {
            maintainerStats[author].firstPR = mergeDate;
          }
          if (!maintainerStats[author].lastPR || mergeDate > maintainerStats[author].lastPR) {
            maintainerStats[author].lastPR = mergeDate;
          }
          
          // Count recent PRs
          const cutoffDate = new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - activityMonths);
          if (mergeDate >= cutoffDate) {
            maintainerStats[author].recentPRs++;
          }
        }
      });
      
      // Apply filters before selecting top maintainers
      const eligibleMaintainers = Object.values(maintainerStats).filter(m => {
        // Check minimum PR count
        if (!meetsMinimumPRs(allPRs, m.name)) {
          return false;
        }
        
        // Check if active (if filter is enabled)
        if (activeOnly && !isContributorActive(allPRs, m.name)) {
          return false;
        }
        
        return true;
      });
      
      // Get top maintainers from eligible ones
      const topMaintainers = eligibleMaintainers
        .sort((a, b) => b.totalPRs - a.totalPRs)
        .slice(0, 8);
      
      const indicators = topMaintainers.map(m => {
        // Calculate metrics
        const months = Object.keys(m.monthlyActivity).sort();
        const avgMonthlyPRs = months.length > 0 ? (m.totalPRs / months.length).toFixed(1) : 0;
        const recentAvg = (m.recentPRs / activityMonths).toFixed(1);
        
        // Calculate gaps
        let longestGap = 0;
        for (let i = 0; i < months.length - 1; i++) {
          const current = new Date(months[i] + '-01');
          const next = new Date(months[i + 1] + '-01');
          const monthDiff = (next.getFullYear() - current.getFullYear()) * 12 + 
                           (next.getMonth() - current.getMonth()) - 1;
          if (monthDiff > longestGap) longestGap = monthDiff;
        }
        
        // Determine trend
        const trend = parseFloat(recentAvg) > parseFloat(avgMonthlyPRs) ? 'increasing' : 
                     parseFloat(recentAvg) < parseFloat(avgMonthlyPRs) * 0.5 ? 'decreasing significantly' :
                     parseFloat(recentAvg) < parseFloat(avgMonthlyPRs) ? 'decreasing' : 'stable';
        
        // Calculate health scores (0-100)
        const activityScore = Math.min(100, (parseFloat(recentAvg) / Math.max(1, parseFloat(avgMonthlyPRs))) * 100);
        const consistencyScore = Math.max(0, 100 - (longestGap * 10));
        const workloadScore = Math.min(100, (parseFloat(avgMonthlyPRs) / 10) * 100);
        const diversityScore = calculateDiversityScore(m.repos);
        const sustainabilityScore = calculateSustainabilityScore({
          trend,
          longestGap,
          recentAvg: parseFloat(recentAvg)
        });
        
        return {
          maintainer: m.name,
          activity: Math.round(activityScore),
          consistency: Math.round(consistencyScore),
          workload: Math.round(workloadScore),
          diversity: Math.round(diversityScore),
          sustainability: Math.round(sustainabilityScore),
          trend,
          totalPRs: m.totalPRs,
          recentPRs: m.recentPRs
        };
      });
      
      setHealthData(indicators);
      
      // Reset selected maintainer if it's no longer in the filtered list
      if (selectedMaintainer !== 'all' && !indicators.find(m => m.maintainer === selectedMaintainer)) {
        setSelectedMaintainer('all');
      }
    };
    
    calculateHealthIndicators();
  }, [data, activeOnly, activityMonths, isContributorActive, meetsMinimumPRs, minPRs]);
  
  const calculateDiversityScore = (repos) => {
    const repoCount = repos.size;
    if (repoCount === 1) return 30;
    if (repoCount === 2) return 70;
    return 100;
  };
  
  const calculateSustainabilityScore = (maintainer) => {
    let score = 100;
    if (maintainer.trend.includes('decreasing significantly')) score -= 40;
    else if (maintainer.trend.includes('decreasing')) score -= 20;
    if (maintainer.longestGap > 3) score -= 20;
    if (maintainer.recentAvg < 1) score -= 20;
    return Math.max(0, score);
  };
  
  const getRadarData = () => {
    if (selectedMaintainer === 'all') {
      // Average across all maintainers
      const avgData = {
        indicator: 'Average',
        activity: 0,
        consistency: 0,
        workload: 0,
        diversity: 0,
        sustainability: 0
      };
      
      healthData.forEach(m => {
        avgData.activity += m.activity;
        avgData.consistency += m.consistency;
        avgData.workload += m.workload;
        avgData.diversity += m.diversity;
        avgData.sustainability += m.sustainability;
      });
      
      const count = healthData.length || 1;
      return [{
        indicator: 'Activity',
        value: Math.round(avgData.activity / count)
      }, {
        indicator: 'Consistency',
        value: Math.round(avgData.consistency / count)
      }, {
        indicator: 'Workload',
        value: Math.round(avgData.workload / count)
      }, {
        indicator: 'Diversity',
        value: Math.round(avgData.diversity / count)
      }, {
        indicator: 'Sustainability',
        value: Math.round(avgData.sustainability / count)
      }];
    } else {
      const m = healthData.find(d => d.maintainer === selectedMaintainer);
      if (!m) return [];
      
      return [{
        indicator: 'Activity',
        value: m.activity
      }, {
        indicator: 'Consistency',
        value: m.consistency
      }, {
        indicator: 'Workload',
        value: m.workload
      }, {
        indicator: 'Diversity',
        value: m.diversity
      }, {
        indicator: 'Sustainability',
        value: m.sustainability
      }];
    }
  };
  
  const getRiskLevel = (sustainability) => {
    if (sustainability >= 80) return { level: 'Healthy', color: '#10B981' };
    if (sustainability >= 60) return { level: 'Monitor', color: '#F59E0B' };
    if (sustainability >= 40) return { level: 'At Risk', color: '#EF4444' };
    return { level: 'Critical', color: '#DC2626' };
  };
  
  return (
    <div className="health-indicators">
      <div className="controls">
        <label>Select Maintainer: </label>
        <select value={selectedMaintainer} onChange={(e) => setSelectedMaintainer(e.target.value)}>
          <option value="all">All Maintainers (Average)</option>
          {healthData.map(m => (
            <option key={m.maintainer} value={m.maintainer}>{m.maintainer}</option>
          ))}
        </select>
      </div>
      
      {healthData.length === 0 ? (
        <div className="no-data-message">
          No maintainers match the current filter criteria (active in last {activityMonths} months with {minPRs}+ PRs)
        </div>
      ) : (
        <>
          <div className="radar-section">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={getRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="indicator" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Health Score" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="risk-grid">
            <h3>Maintainer Risk Assessment</h3>
            <p className="filter-status">
              Showing {healthData.length} maintainers 
              {activeOnly && ` (active in last ${activityMonths} months)`}
              {minPRs > 1 && ` with ${minPRs}+ PRs`}
            </p>
            <div className="risk-cards">
              {healthData.map(m => {
                const risk = getRiskLevel(m.sustainability);
                return (
                  <div key={m.maintainer} className="risk-card" style={{ borderColor: risk.color }}>
                    <h4>{m.maintainer}</h4>
                    <div className="risk-level" style={{ color: risk.color }}>
                      {risk.level}
                    </div>
                    <div className="risk-details">
                      <span>Trend: {m.trend}</span>
                      <span>Sustainability: {m.sustainability}%</span>
                      <span>Total PRs: {m.totalPRs}</span>
                      <span>Recent PRs: {m.recentPRs}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      
      <div className="indicator-legend">
        <h4>Health Indicators Explained:</h4>
        <ul>
          <li><strong>Activity</strong>: Recent activity compared to historical average</li>
          <li><strong>Consistency</strong>: Regularity of contributions (penalized for long gaps)</li>
          <li><strong>Workload</strong>: Overall contribution volume</li>
          <li><strong>Diversity</strong>: Contribution across multiple repositories</li>
          <li><strong>Sustainability</strong>: Overall health considering all factors</li>
        </ul>
      </div>
    </div>
  );
}

export default MaintainerHealthIndicators;