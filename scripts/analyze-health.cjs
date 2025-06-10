#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load PR data
const witnessData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/witness-prs.json')));
const goWitnessData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/go-witness-prs.json')));
const archivistaData = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/archivista-prs.json')));

// Analyze contributor diversity
function analyzeContributors(data, repoName) {
  const contributors = {};
  const monthlyContributors = {};
  const humanOnlyData = [];
  
  data.forEach(pr => {
    const author = pr.author?.login || 'unknown';
    
    // Filter out bots for human-only data
    if (author !== 'unknown' && !author.includes('bot') && !author.includes('app/')) {
      humanOnlyData.push(pr);
    }
    
    contributors[author] = (contributors[author] || 0) + 1;
    
    if (pr.mergedAt) {
      const month = pr.mergedAt.substring(0, 7);
      if (!monthlyContributors[month]) {
        monthlyContributors[month] = new Set();
      }
      monthlyContributors[month].add(author);
    }
  });
  
  const humanContributors = Object.keys(contributors).filter(
    c => !c.includes('bot') && !c.includes('app/')
  );
  
  // Get top human contributors only
  const humanContributorCounts = {};
  humanContributors.forEach(c => {
    humanContributorCounts[c] = contributors[c];
  });
  
  const topContributors = Object.entries(humanContributorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Calculate bus factor (human contributors with >10% of human PRs)
  const totalHumanPRs = humanOnlyData.length;
  const significantContributors = Object.entries(humanContributorCounts)
    .filter(([_, count]) => count / totalHumanPRs > 0.1)
    .map(([name, count]) => ({ name, percentage: ((count / totalHumanPRs) * 100).toFixed(1) }));
  
  // Average unique contributors per month (last 12 months)
  const last12Months = Object.entries(monthlyContributors)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);
  
  const avgMonthlyContributors = last12Months.length > 0
    ? (last12Months.reduce((sum, [_, contributors]) => sum + contributors.size, 0) / last12Months.length).toFixed(1)
    : 0;
  
  return {
    repoName,
    totalPRs: data.length,
    totalHumanPRs: humanOnlyData.length,
    totalBotPRs: data.length - humanOnlyData.length,
    totalContributors: Object.keys(contributors).length,
    humanContributors: humanContributors.length,
    topContributors,
    significantContributors,
    avgMonthlyContributors,
    busFactor: significantContributors.length
  };
}

// Analyze PR velocity
function analyzePRVelocity(data, repoName) {
  const monthlyPRs = {};
  const monthlyHumanPRs = {};
  
  data.forEach(pr => {
    if (pr.mergedAt) {
      const author = pr.author?.login || 'unknown';
      const isHuman = author !== 'unknown' && !author.includes('bot') && !author.includes('app/');
      const month = pr.mergedAt.substring(0, 7);
      
      monthlyPRs[month] = (monthlyPRs[month] || 0) + 1;
      
      if (isHuman) {
        monthlyHumanPRs[month] = (monthlyHumanPRs[month] || 0) + 1;
      }
    }
  });
  
  const months = Object.keys(monthlyPRs).sort();
  const last12Months = months.slice(-12);
  const last3Months = months.slice(-3);
  
  const avgLast12 = last12Months.length > 0
    ? (last12Months.reduce((sum, m) => sum + monthlyPRs[m], 0) / last12Months.length).toFixed(1)
    : 0;
    
  const avgLast3 = last3Months.length > 0
    ? (last3Months.reduce((sum, m) => sum + monthlyPRs[m], 0) / last3Months.length).toFixed(1)
    : 0;
  
  const trend = avgLast3 > avgLast12 ? 'increasing' : avgLast3 < avgLast12 ? 'decreasing' : 'stable';
  
  return {
    repoName,
    avgPRsPerMonthLast12: avgLast12,
    avgPRsPerMonthLast3: avgLast3,
    trend,
    lastMonth: months[months.length - 1] || 'N/A'
  };
}

// Generate report
console.log('# in-toto Project Health Analysis\n');
console.log(`Generated: ${new Date().toISOString()}\n`);

console.log('## Contributor Analysis\n');
const repos = [
  { data: witnessData, name: 'witness' },
  { data: goWitnessData, name: 'go-witness' },
  { data: archivistaData, name: 'archivista' }
];

repos.forEach(({ data, name }) => {
  const analysis = analyzeContributors(data, name);
  console.log(`### ${name}`);
  console.log(`- Total PRs: ${analysis.totalPRs} (${analysis.totalHumanPRs} human, ${analysis.totalBotPRs} bot)`);
  console.log(`- Human Contributors: ${analysis.humanContributors}`);
  console.log(`- Average Monthly Contributors (last 12 months): ${analysis.avgMonthlyContributors}`);
  console.log(`- Bus Factor: ${analysis.busFactor} contributors with >10% of PRs`);
  if (analysis.significantContributors.length > 0) {
    console.log(`  - ${analysis.significantContributors.map(c => `${c.name} (${c.percentage}%)`).join(', ')}`);
  }
  console.log(`- Top 5 Contributors:`);
  analysis.topContributors.forEach(([name, count]) => {
    console.log(`  - ${name}: ${count} PRs`);
  });
  console.log('');
});

console.log('## PR Velocity Analysis\n');
repos.forEach(({ data, name }) => {
  const velocity = analyzePRVelocity(data, name);
  console.log(`### ${name}`);
  console.log(`- Average PRs/month (last 12 months): ${velocity.avgPRsPerMonthLast12}`);
  console.log(`- Average PRs/month (last 3 months): ${velocity.avgPRsPerMonthLast3}`);
  console.log(`- Trend: ${velocity.trend}`);
  console.log(`- Last PR merged: ${velocity.lastMonth}`);
  console.log('');
});

// Overall health score
console.log('## Overall Health Indicators\n');
const totalPRs = witnessData.length + goWitnessData.length + archivistaData.length;
const allContributors = new Set();

[witnessData, goWitnessData, archivistaData].forEach(data => {
  data.forEach(pr => {
    if (pr.author?.login) {
      allContributors.add(pr.author.login);
    }
  });
});

const humanContributors = Array.from(allContributors).filter(
  c => !c.includes('bot') && !c.includes('app/')
);

console.log(`- Total PRs across all repos: ${totalPRs}`);
console.log(`- Total unique contributors: ${allContributors.size} (${humanContributors.length} human)`);
console.log(`- Average PRs per contributor: ${(totalPRs / allContributors.size).toFixed(1)}`);

// Save analysis to file
const analysisPath = path.join(__dirname, '../public/data/health-analysis.json');
const analysisData = {
  generated: new Date().toISOString(),
  repositories: repos.map(({ data, name }) => ({
    name,
    contributors: analyzeContributors(data, name),
    velocity: analyzePRVelocity(data, name)
  })),
  overall: {
    totalPRs,
    totalContributors: allContributors.size,
    humanContributors: humanContributors.length,
    avgPRsPerContributor: (totalPRs / allContributors.size).toFixed(1)
  }
};

fs.writeFileSync(analysisPath, JSON.stringify(analysisData, null, 2));
console.log(`\nAnalysis saved to: ${analysisPath}`);