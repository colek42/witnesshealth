# Witness Health Dashboard

A health analytics dashboard for monitoring maintainer activity and project sustainability in the in-toto project repositories.

## Overview

This dashboard provides insights into:
- Maintainer activity patterns over time
- Project health indicators
- Pull request lifecycle metrics
- Bus factor and sustainability risks

## Live Dashboard

Visit the live dashboard at: https://colek42.github.io/witnesshealth/

## Features

- **Maintainer Activity Timeline**: Track individual maintainer contributions over time
- **Health Indicators**: Assess maintainer health across multiple dimensions (activity, consistency, workload, diversity, sustainability)
- **PR Metrics**: Analyze time to merge and time to first comment trends
- **Filtering**: Focus on active contributors and filter out drive-by contributions
- **Daily Updates**: Automated data collection runs daily at midnight UTC

## Repositories Analyzed

- [in-toto/witness](https://github.com/in-toto/witness)
- [in-toto/go-witness](https://github.com/in-toto/go-witness)
- [in-toto/archivista](https://github.com/in-toto/archivista)

## Development

### Prerequisites

- Node.js 20+
- GitHub CLI (`gh`)

### Setup

```bash
# Clone the repository
git clone https://github.com/colek42/witnesshealth.git
cd witnesshealth

# Install dependencies
npm install

# Collect data (requires GitHub authentication)
cd scripts
./collect-pr-data.sh
cd ..

# Run development server
npm run dev
```

### Building

```bash
npm run build
```

### Data Collection

The `scripts/collect-pr-data.sh` script fetches PR data from GitHub using the GitHub CLI. Make sure you're authenticated with `gh auth login` before running.

## Architecture

- **Frontend**: React + Vite
- **Visualization**: Recharts
- **Data Collection**: GitHub CLI + Node.js scripts
- **Deployment**: GitHub Actions + GitHub Pages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
