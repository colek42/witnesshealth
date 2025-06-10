#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load PR data
const witnessData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/witness-prs.json')));
const goWitnessData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/go-witness-prs.json')));
const archivistaData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/archivista-prs.json')));

// Combine all data
const allPRs = [
  ...witnessData.map(pr => ({ ...pr, repo: 'witness' })),
  ...goWitnessData.map(pr => ({ ...pr, repo: 'go-witness' })),
  ...archivistaData.map(pr => ({ ...pr, repo: 'archivista' }))
];

// Filter out bots
const humanPRs = allPRs.filter(pr => {
  const author = pr.author?.login || 'unknown';
  return author !== 'unknown' && !author.includes('bot') && !author.includes('app/');
});

// Get top maintainers
function getTopMaintainers(limit = 8) {
  const maintainerCounts = {};
  humanPRs.forEach(pr => {
    const author = pr.author.login;
    maintainerCounts[author] = (maintainerCounts[author] || 0) + 1;
  });
  
  return Object.entries(maintainerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, totalPRs: count }));
}

// Analyze maintainer capacity patterns
function analyzeMaintainerCapacity(maintainerName) {
  const maintainerPRs = humanPRs.filter(pr => pr.author.login === maintainerName);
  
  // Monthly activity
  const monthlyActivity = {};
  maintainerPRs.forEach(pr => {
    if (pr.mergedAt) {
      const month = pr.mergedAt.substring(0, 7);
      monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
    }
  });
  
  // Calculate activity patterns
  const months = Object.keys(monthlyActivity).sort();
  const activityValues = months.map(m => monthlyActivity[m]);
  
  // Find gaps (months with no activity)
  const gaps = [];
  for (let i = 0; i < months.length - 1; i++) {
    const current = new Date(months[i] + '-01');
    const next = new Date(months[i + 1] + '-01');
    const monthDiff = (next.getFullYear() - current.getFullYear()) * 12 + (next.getMonth() - current.getMonth());
    
    if (monthDiff > 1) {
      gaps.push({
        start: months[i],
        end: months[i + 1],
        duration: monthDiff - 1
      });
    }
  }
  
  // Calculate metrics
  const avgMonthlyPRs = activityValues.reduce((a, b) => a + b, 0) / activityValues.length;
  const maxMonthlyPRs = Math.max(...activityValues);
  const recentActivity = months.slice(-3).map(m => monthlyActivity[m] || 0);
  const recentAvg = recentActivity.reduce((a, b) => a + b, 0) / recentActivity.length;
  
  // Detect trends
  const trend = recentAvg > avgMonthlyPRs ? 'increasing' : 
                recentAvg < avgMonthlyPRs * 0.5 ? 'decreasing significantly' :
                recentAvg < avgMonthlyPRs ? 'decreasing' : 'stable';
  
  // Repository focus
  const repoActivity = {};
  maintainerPRs.forEach(pr => {
    repoActivity[pr.repo] = (repoActivity[pr.repo] || 0) + 1;
  });
  
  return {
    name: maintainerName,
    totalPRs: maintainerPRs.length,
    firstPR: maintainerPRs[maintainerPRs.length - 1]?.mergedAt,
    lastPR: maintainerPRs[0]?.mergedAt,
    avgMonthlyPRs: avgMonthlyPRs.toFixed(1),
    maxMonthlyPRs,
    recentAvg: recentAvg.toFixed(1),
    trend,
    gaps,
    longestGap: gaps.length > 0 ? Math.max(...gaps.map(g => g.duration)) : 0,
    repoActivity,
    monthlyActivity
  };
}

// Analyze collaboration patterns
function analyzeCollaboration() {
  const collaborations = {};
  
  // Group PRs by month
  const monthlyPRs = {};
  humanPRs.forEach(pr => {
    if (pr.mergedAt) {
      const month = pr.mergedAt.substring(0, 7);
      if (!monthlyPRs[month]) monthlyPRs[month] = [];
      monthlyPRs[month].push(pr.author.login);
    }
  });
  
  // Count co-occurrences
  Object.values(monthlyPRs).forEach(authors => {
    const uniqueAuthors = [...new Set(authors)];
    for (let i = 0; i < uniqueAuthors.length; i++) {
      for (let j = i + 1; j < uniqueAuthors.length; j++) {
        const pair = [uniqueAuthors[i], uniqueAuthors[j]].sort().join(' & ');
        collaborations[pair] = (collaborations[pair] || 0) + 1;
      }
    }
  });
  
  return Object.entries(collaborations)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pair, count]) => ({ pair, count }));
}

// Generate report
console.log('# Maintainer Capacity Analysis\n');
console.log(`Generated: ${new Date().toISOString()}\n`);

const topMaintainers = getTopMaintainers();

console.log('## Top Maintainers Overview\n');
topMaintainers.forEach(m => {
  console.log(`- **${m.name}**: ${m.totalPRs} total PRs`);
});

console.log('\n## Individual Maintainer Analysis\n');

const analyses = topMaintainers.map(m => analyzeMaintainerCapacity(m.name));

analyses.forEach(analysis => {
  console.log(`### ${analysis.name}\n`);
  console.log(`- **Total PRs**: ${analysis.totalPRs}`);
  console.log(`- **Active Period**: ${analysis.firstPR?.substring(0, 7)} to ${analysis.lastPR?.substring(0, 7)}`);
  console.log(`- **Average Monthly PRs**: ${analysis.avgMonthlyPRs} (peak: ${analysis.maxMonthlyPRs})`);
  console.log(`- **Recent Activity** (last 3 months): ${analysis.recentAvg} PRs/month`);
  console.log(`- **Trend**: ${analysis.trend}`);
  
  if (analysis.gaps.length > 0) {
    console.log(`- **Inactivity Periods**: ${analysis.gaps.length} gaps`);
    console.log(`  - Longest gap: ${analysis.longestGap} months`);
    if (analysis.gaps.length <= 3) {
      analysis.gaps.forEach(gap => {
        console.log(`  - ${gap.start} to ${gap.end} (${gap.duration} months)`);
      });
    }
  }
  
  console.log(`- **Repository Focus**:`);
  Object.entries(analysis.repoActivity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([repo, count]) => {
      const percentage = ((count / analysis.totalPRs) * 100).toFixed(1);
      console.log(`  - ${repo}: ${count} PRs (${percentage}%)`);
    });
  
  console.log('');
});

// Risk indicators
console.log('## Capacity Risk Indicators\n');

const risks = [];

analyses.forEach(analysis => {
  const riskFactors = [];
  
  // Declining activity
  if (analysis.trend.includes('decreasing')) {
    riskFactors.push(`Activity ${analysis.trend}`);
  }
  
  // Long gaps
  if (analysis.longestGap >= 3) {
    riskFactors.push(`Had ${analysis.longestGap}-month gap`);
  }
  
  // Low recent activity
  if (parseFloat(analysis.recentAvg) < 1) {
    riskFactors.push('Low recent activity');
  }
  
  if (riskFactors.length > 0) {
    risks.push({
      name: analysis.name,
      factors: riskFactors
    });
  }
});

if (risks.length > 0) {
  console.log('**Maintainers showing signs of reduced capacity:**\n');
  risks.forEach(risk => {
    console.log(`- **${risk.name}**: ${risk.factors.join(', ')}`);
  });
} else {
  console.log('No immediate capacity risks identified.');
}

// Collaboration patterns
console.log('\n## Collaboration Patterns\n');
console.log('**Most frequent collaborators (active in same months):**\n');

const collaborations = analyzeCollaboration();
collaborations.forEach(({ pair, count }) => {
  console.log(`- ${pair}: ${count} months`);
});

// Save detailed analysis
const detailedAnalysis = {
  generated: new Date().toISOString(),
  topMaintainers: analyses,
  collaborations,
  risks
};

fs.writeFileSync(
  path.join(__dirname, '../public/data/maintainer-capacity-analysis.json'),
  JSON.stringify(detailedAnalysis, null, 2)
);

console.log('\n## Recommendations\n');
console.log('1. **Monitor declining contributors**: Reach out to maintainers showing decreased activity');
console.log('2. **Knowledge transfer**: Ensure critical knowledge is shared among active maintainers');
console.log('3. **Recruitment**: Consider recruiting new maintainers to distribute workload');
console.log('4. **Collaboration**: Encourage pair programming and co-maintenance of repositories');

console.log(`\nDetailed analysis saved to: maintainer-capacity-analysis.json`);