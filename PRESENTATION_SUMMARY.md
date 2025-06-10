# in-toto Project Health & Maintainer Capacity Analysis

## Executive Summary

We've developed a comprehensive analytics dashboard to track maintainer capacity and project health for the in-toto project. This analysis reveals critical insights about contributor patterns, burnout risks, and sustainability concerns.

## Key Findings

### 1. Maintainer Activity Patterns
- **Currently Active** (6 months): Only 12 maintainers have merged PRs
- **Recently Inactive**: 20 maintainers dropped off in the last year
- **Workload Concentration**: Top 3 maintainers handle 57% of recent work
- **Bus Factor Risk**: Only 3 people needed to control 50% of contributions

### 2. Risk Assessment

#### High Risk Maintainers
- **ChaosInTheCRD**: 6-month gap, activity down 67% (from 6.0 to 2.0 PRs/month)
- **jkjell**: Activity down 56% (from 4.5 to 2.0 PRs/month)
- **kairoaraujo**: Activity down 64% (from 2.8 to 1.0 PRs/month)

#### Moderate Risk
- **mikhailswift**: Most active contributor but showing 20% decline
- **colek42**: Had 10-month gap historically, currently stable but below average

#### Positive Indicators
- **matglas & fkautz**: Showing increased activity recently

### 3. Project Health Metrics

#### Human Contribution Statistics
- **Total Human PRs**: 420 (34% of all PRs)
- **Bot PRs Excluded**: 820 (66% were from bots)
- **Bus Factor**: 4 maintainers control >50% of human contributions

#### Repository Distribution
- **witness**: 184 human PRs
- **go-witness**: 124 human PRs  
- **archivista**: 112 human PRs

### 4. Collaboration Patterns
Strong collaboration pairs indicate knowledge sharing:
- colek42 & mikhailswift: 16 months of overlap
- jkjell & mikhailswift: 11 months of overlap

## Visualizations Created

### 1. **Maintainer Activity Timeline**
- Shows individual contributor PR velocity over 24 months
- Highlights gaps and periods of reduced activity
- Makes burnout patterns visible

### 2. **Health Indicator Radar Chart**
Tracks 5 key metrics per maintainer:
- **Activity**: Recent vs historical performance
- **Consistency**: Regularity of contributions
- **Workload**: Overall contribution volume
- **Diversity**: Cross-repository contributions
- **Sustainability**: Combined health score

### 3. **Risk Assessment Dashboard**
- Color-coded risk levels (Healthy/Monitor/At Risk/Critical)
- Real-time sustainability scores
- Trend indicators

## Recommendations for Community Meeting

### 1. **Immediate Actions**
- Reach out to at-risk maintainers (ChaosInTheCRD, jkjell, kairoaraujo)
- Understand reasons for capacity reduction
- Offer support or temporary reduction in responsibilities

### 2. **Medium-term Strategy**
- **Recruit New Maintainers**: Current bus factor is concerning
- **Knowledge Transfer**: Pair at-risk maintainers with active ones
- **Workload Distribution**: Better balance across maintainers

### 3. **Long-term Sustainability**
- Establish maintainer rotation schedules
- Create mentorship program for new contributors
- Set up regular health check-ins

## Technical Implementation

### Data Collection
- GitHub CLI integration for real-time PR data
- Automated analysis scripts
- Bot filtering for accurate human metrics

### Analytics Dashboard
- React-based interactive visualizations
- **NEW: Activity-based filtering** (3, 6, 12, 24 month windows)
- Real-time health monitoring
- Historical trend analysis

### Key Scripts
1. `collect-pr-data.sh`: Fetches latest PR data
2. `analyze-health.cjs`: General health metrics
3. `maintainer-capacity-analysis.cjs`: Deep dive on individual maintainers
4. `active-maintainer-analysis.cjs`: Focus on currently active contributors

### Filtering Capabilities
- **Toggle**: Show all contributors vs. only active ones
- **Time Windows**: 3, 6, 12, or 24 month activity filters
- **Applied Globally**: All charts update based on filter selection

## Presentation Talking Points

1. **Open with Impact**: "5 of our 8 top maintainers are showing signs of burnout"
2. **Show Timeline Visual**: Demonstrate capacity fluctuations over time
3. **Present Risk Dashboard**: Highlight at-risk maintainers
4. **Discuss Bus Factor**: Only 4 people control >50% of contributions
5. **End with Actions**: Concrete steps to improve sustainability

## Next Steps

1. Run analysis monthly to track improvements
2. Set up alerts for maintainer inactivity >2 months
3. Create contributor onboarding program
4. Establish sustainable contribution guidelines

---

**Dashboard URL**: http://localhost:5173/
**Data Updated**: June 10, 2025