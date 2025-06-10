#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load PR data
const witnessData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/witness-prs.json')));
const goWitnessData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/go-witness-prs.json')));
const archivistaData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/archivista-prs.json')));

// Parse command line arguments
const args = process.argv.slice(2);
const monthsArg = args.find(arg => arg.startsWith('--months='));
const ACTIVITY_MONTHS = monthsArg ? parseInt(monthsArg.split('=')[1]) : 6;

console.log(`# Active Maintainer Analysis (Last ${ACTIVITY_MONTHS} Months)\n`);
console.log(`Generated: ${new Date().toISOString()}\n`);

// Combine all data
const allPRs = [
  ...witnessData.map(pr => ({ ...pr, repo: 'witness' })),
  ...goWitnessData.map(pr => ({ ...pr, repo: 'go-witness' })),
  ...archivistaData.map(pr => ({ ...pr, repo: 'archivista' }))
];

// Filter for recent activity
const cutoffDate = new Date();
cutoffDate.setMonth(cutoffDate.getMonth() - ACTIVITY_MONTHS);

// Get active maintainers
function getActiveMaintainers() {
  const activeMaintainers = new Set();
  const maintainerLastActivity = {};
  
  allPRs.forEach(pr => {
    const author = pr.author?.login || 'unknown';
    if (author === 'unknown' || author.includes('bot') || author.includes('app/')) {
      return;
    }
    
    if (pr.mergedAt) {
      const mergeDate = new Date(pr.mergedAt);
      
      // Track last activity
      if (!maintainerLastActivity[author] || mergeDate > maintainerLastActivity[author]) {
        maintainerLastActivity[author] = mergeDate;
      }
      
      if (mergeDate >= cutoffDate) {
        activeMaintainers.add(author);
      }
    }
  });
  
  return { activeMaintainers, maintainerLastActivity };
}

// Analyze active maintainers
function analyzeActiveMaintainers() {
  const { activeMaintainers, maintainerLastActivity } = getActiveMaintainers();
  const activeList = Array.from(activeMaintainers);
  
  console.log(`## Active Maintainers Summary\n`);
  console.log(`- **Currently Active**: ${activeList.length} maintainers`);
  console.log(`- **Definition**: Contributors with merged PRs in the last ${ACTIVITY_MONTHS} months\n`);
  
  // Get detailed stats for active maintainers
  const maintainerStats = {};
  
  allPRs.forEach(pr => {
    const author = pr.author?.login;
    if (activeList.includes(author) && pr.mergedAt) {
      const mergeDate = new Date(pr.mergedAt);
      
      if (!maintainerStats[author]) {
        maintainerStats[author] = {
          totalPRs: 0,
          recentPRs: 0,
          repos: new Set(),
          firstPR: mergeDate,
          lastPR: mergeDate
        };
      }
      
      maintainerStats[author].totalPRs++;
      if (mergeDate >= cutoffDate) {
        maintainerStats[author].recentPRs++;
      }
      maintainerStats[author].repos.add(pr.repo);
      
      if (mergeDate < maintainerStats[author].firstPR) {
        maintainerStats[author].firstPR = mergeDate;
      }
      if (mergeDate > maintainerStats[author].lastPR) {
        maintainerStats[author].lastPR = mergeDate;
      }
    }
  });
  
  // Sort by recent activity
  const sortedMaintainers = Object.entries(maintainerStats)
    .sort((a, b) => b[1].recentPRs - a[1].recentPRs)
    .map(([name, stats]) => ({ name, ...stats }));
  
  console.log(`## Active Maintainer Details\n`);
  sortedMaintainers.forEach((m, index) => {
    const daysSinceLastPR = Math.floor((new Date() - m.lastPR) / (1000 * 60 * 60 * 24));
    const avgPRsPerMonth = (m.recentPRs / ACTIVITY_MONTHS).toFixed(1);
    
    console.log(`### ${index + 1}. ${m.name}`);
    console.log(`- **Recent Activity**: ${m.recentPRs} PRs in last ${ACTIVITY_MONTHS} months (${avgPRsPerMonth}/month)`);
    console.log(`- **Last PR**: ${daysSinceLastPR} days ago`);
    console.log(`- **Total PRs**: ${m.totalPRs} (all time)`);
    console.log(`- **Active Repos**: ${Array.from(m.repos).join(', ')}`);
    console.log('');
  });
  
  // Find recently inactive maintainers
  console.log(`## Recently Inactive Maintainers\n`);
  console.log(`Maintainers who were active but haven't contributed in the last ${ACTIVITY_MONTHS} months:\n`);
  
  const inactiveMaintainers = [];
  Object.entries(maintainerLastActivity).forEach(([name, lastActivity]) => {
    if (!activeMaintainers.has(name) && lastActivity > new Date('2023-01-01')) {
      const daysSinceLastPR = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));
      const monthsSinceLastPR = Math.floor(daysSinceLastPR / 30);
      inactiveMaintainers.push({ name, lastActivity, daysSinceLastPR, monthsSinceLastPR });
    }
  });
  
  inactiveMaintainers
    .sort((a, b) => a.daysSinceLastPR - b.daysSinceLastPR)
    .slice(0, 10)
    .forEach(m => {
      console.log(`- **${m.name}**: Last active ${m.monthsSinceLastPR} months ago`);
    });
  
  return { activeMaintainers: sortedMaintainers, inactiveMaintainers };
}

// Analyze workload distribution
function analyzeWorkloadDistribution(activeMaintainers) {
  console.log(`\n## Workload Distribution\n`);
  
  const totalRecentPRs = activeMaintainers.reduce((sum, m) => sum + m.recentPRs, 0);
  
  console.log(`**Recent PR Distribution** (last ${ACTIVITY_MONTHS} months):\n`);
  activeMaintainers.slice(0, 5).forEach(m => {
    const percentage = ((m.recentPRs / totalRecentPRs) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(percentage / 2));
    console.log(`${m.name}: ${bar} ${percentage}% (${m.recentPRs} PRs)`);
  });
  
  // Calculate bus factor
  let cumulative = 0;
  let busFactor = 0;
  for (const m of activeMaintainers) {
    cumulative += m.recentPRs;
    busFactor++;
    if (cumulative >= totalRecentPRs * 0.5) break;
  }
  
  console.log(`\n**Bus Factor**: ${busFactor} maintainers control 50% of recent contributions`);
}

// Main analysis
const { activeMaintainers, inactiveMaintainers } = analyzeActiveMaintainers();
analyzeWorkloadDistribution(activeMaintainers);

// Save results
const results = {
  generated: new Date().toISOString(),
  activityMonths: ACTIVITY_MONTHS,
  activeMaintainers,
  inactiveMaintainers: inactiveMaintainers.slice(0, 10),
  summary: {
    activeCount: activeMaintainers.length,
    totalRecentPRs: activeMaintainers.reduce((sum, m) => sum + m.recentPRs, 0)
  }
};

fs.writeFileSync(
  path.join(__dirname, '../public/data/active-maintainer-analysis.json'),
  JSON.stringify(results, null, 2)
);

console.log(`\n## Recommendations\n`);
console.log(`1. **Focus on Active Contributors**: With only ${activeMaintainers.length} active maintainers, retention is critical`);
console.log(`2. **Re-engage Recent Dropoffs**: ${inactiveMaintainers.length} maintainers became inactive recently`);
console.log(`3. **Distribute Workload**: Top 3 maintainers handle ${((activeMaintainers.slice(0, 3).reduce((s, m) => s + m.recentPRs, 0) / results.summary.totalRecentPRs) * 100).toFixed(0)}% of work`);

console.log(`\nAnalysis saved to: active-maintainer-analysis.json`);