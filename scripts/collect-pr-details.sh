#!/bin/bash

# Script to collect detailed PR data including comments

OUTPUT_DIR="../public/data"
mkdir -p "$OUTPUT_DIR"

echo "Collecting detailed PR data with comments..."

# Function to get PR details including first comment time
get_pr_details() {
    local repo=$1
    local output_file=$2
    local temp_file="${output_file}.tmp"
    
    echo "Fetching detailed data for $repo..."
    
    # First get list of merged PRs
    gh pr list --repo "$repo" --state merged --limit 100 --json number,author,title,createdAt,mergedAt > "$temp_file"
    
    # Add timeline data for each PR (comments, reviews)
    echo "[" > "$OUTPUT_DIR/$output_file"
    
    jq -c '.[]' "$temp_file" | while read pr; do
        pr_number=$(echo "$pr" | jq -r '.number')
        
        # Get timeline events for this PR
        timeline=$(gh api "repos/$repo/issues/$pr_number/timeline" --jq '[.[] | select(.event == "commented" or .event == "reviewed") | {event: .event, created_at: .created_at}] | sort_by(.created_at) | first')
        
        # Merge PR data with first comment/review time
        if [ "$timeline" != "null" ] && [ "$timeline" != "" ]; then
            first_interaction=$(echo "$timeline" | jq -r '.created_at // empty')
            echo "$pr" | jq --arg interaction "$first_interaction" '. + {firstInteraction: $interaction}'
        else
            echo "$pr"
        fi
        
        # Add comma except for last item
        echo ","
    done | sed '$ s/,$//' >> "$OUTPUT_DIR/$output_file"
    
    echo "]" >> "$OUTPUT_DIR/$output_file"
    
    rm "$temp_file"
    
    echo "Saved detailed data to $OUTPUT_DIR/$output_file"
}

# Collect data for each repository (limited to recent PRs for API rate limits)
get_pr_details "in-toto/witness" "witness-pr-details.json"
get_pr_details "in-toto/go-witness" "go-witness-pr-details.json"
get_pr_details "in-toto/archivista" "archivista-pr-details.json"

echo "Detailed data collection complete!"