#!/bin/bash

# Script to collect issue and review data

OUTPUT_DIR="../public/data"
mkdir -p "$OUTPUT_DIR"

echo "Collecting issue and review data..."

# Function to get issue statistics
get_issue_stats() {
    local repo=$1
    local output_file=$2
    
    echo "Fetching issue statistics for $repo..."
    
    # Get open issues
    open_issues=$(gh issue list --repo "$repo" --state open --limit 9999 --json number | jq 'length')
    
    # Get closed issues
    closed_issues=$(gh issue list --repo "$repo" --state closed --limit 9999 --json number,closedAt | jq '.')
    closed_count=$(echo "$closed_issues" | jq 'length')
    
    # Calculate monthly closed issues
    monthly_closed=$(echo "$closed_issues" | jq -r '
        group_by(.closedAt[0:7]) | 
        map({
            month: .[0].closedAt[0:7],
            count: length
        }) |
        sort_by(.month)
    ')
    
    # Get open PRs
    open_prs=$(gh pr list --repo "$repo" --state open --limit 9999 --json number | jq 'length')
    
    # Create combined statistics
    cat > "$OUTPUT_DIR/$output_file" <<EOF
{
    "openIssues": $open_issues,
    "closedIssues": $closed_count,
    "openPRs": $open_prs,
    "monthlyClosed": $monthly_closed
}
EOF
    
    echo "Saved issue statistics to $OUTPUT_DIR/$output_file"
}

# Function to get review comments data
get_review_data() {
    local repo=$1
    local output_file=$2
    
    echo "Fetching review data for $repo..."
    
    # Get recent PRs with review comments
    pr_reviews=$(gh pr list --repo "$repo" --state all --limit 200 --json number,author,reviews,comments | jq -r '
        map({
            prNumber: .number,
            author: .author.login,
            reviews: .reviews,
            comments: .comments
        }) |
        map({
            prNumber: .prNumber,
            author: .author,
            reviewers: (
                (.reviews // []) | 
                map(select(.author.login != .author)) |
                group_by(.author.login) |
                map({
                    reviewer: .[0].author.login,
                    count: length
                })
            ),
            commenters: (
                (.comments // []) |
                map(select(.author.login != .author)) |
                group_by(.author.login) |
                map({
                    commenter: .[0].author.login,
                    count: length
                })
            )
        })
    ')
    
    # Aggregate reviewer statistics
    reviewer_stats=$(echo "$pr_reviews" | jq -r '
        map(.reviewers) |
        flatten |
        group_by(.reviewer) |
        map({
            reviewer: .[0].reviewer,
            totalReviews: (map(.count) | add)
        }) |
        sort_by(.totalReviews) |
        reverse
    ')
    
    # Aggregate commenter statistics
    commenter_stats=$(echo "$pr_reviews" | jq -r '
        map(.commenters) |
        flatten |
        group_by(.commenter) |
        map({
            commenter: .[0].commenter,
            totalComments: (map(.count) | add)
        }) |
        sort_by(.totalComments) |
        reverse
    ')
    
    # Create combined review data
    cat > "$OUTPUT_DIR/$output_file" <<EOF
{
    "reviewerStats": $reviewer_stats,
    "commenterStats": $commenter_stats,
    "prReviews": $pr_reviews
}
EOF
    
    echo "Saved review data to $OUTPUT_DIR/$output_file"
}

# Collect data for each repository
get_issue_stats "in-toto/witness" "witness-issues.json"
get_issue_stats "in-toto/go-witness" "go-witness-issues.json"
get_issue_stats "in-toto/archivista" "archivista-issues.json"

get_review_data "in-toto/witness" "witness-reviews.json"
get_review_data "in-toto/go-witness" "go-witness-reviews.json"
get_review_data "in-toto/archivista" "archivista-reviews.json"

echo "Issue and review data collection complete!"