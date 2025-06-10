#!/bin/bash

# Script to collect PR data from in-toto repositories

OUTPUT_DIR="../public/data"
mkdir -p "$OUTPUT_DIR"

echo "Collecting PR data from in-toto repositories..."

# Function to get PR data for a repository
get_pr_data() {
    local repo=$1
    local output_file=$2
    
    echo "Fetching data for $repo..."
    
    # Get merged PRs with detailed information
    gh pr list --repo "$repo" --state merged --limit 1000 --json author,mergedAt,title,number,createdAt,updatedAt > "$OUTPUT_DIR/$output_file"
}

# Collect data for each repository
get_pr_data "in-toto/witness" "witness-prs.json"
get_pr_data "in-toto/go-witness" "go-witness-prs.json"
get_pr_data "in-toto/archivista" "archivista-prs.json"

echo "Data collection complete!"