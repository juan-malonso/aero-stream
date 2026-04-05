#!/bin/bash

# Exit immediately if a command fails
set -e

# --- Color Palette ---
BANNER_CLR='\033[1;33m'   # Yellow Bold
HEADER_CLR='\033[1;36m'   # Cyan Bold
KEY_CLR='\033[0;97m'      # White
VAL_CLR='\033[1;34m'      # Blue Bold
INPUT_R='\033[1;33m'      # Yellow Bold
DEFAULT_R='\033[0;90m'    # Grey
WARN_CLR='\033[1;33m'     # Yellow Bold
ERR_CLR='\033[1;31m'      # Red Bold
NC='\033[0m'              # No Color

# --- UI Functions ---

print_banner() {
    echo -e "${BANNER_CLR}==============================================="
    echo -e "  $1"
    echo -e "===============================================${NC}"
}

print_step() {
    echo -e "\n\n${HEADER_CLR}>> STEP [$1]: $2${NC}"
}

print_kv() {
    echo -e "${KEY_CLR}   $1:${VAL_CLR} $2${NC}"
}

print_warn() {
    echo -e "${WARN_CLR}$1${NC}"
}

print_error() {
    echo -e "${ERR_CLR}Error: $1${NC}"
    exit 1
}

prompt_input() {
    local label=$1
    local options=$2
    local default=$3
    local input_val

    local prompt_text="${KEY_CLR}$label"
    [ -n "$options" ] && prompt_text+="${INPUT_R} ($options)"
    [ -n "$default" ] && prompt_text+="${DEFAULT_R} [default: $default]"
    prompt_text+="${NC}: "

    echo -ne "$prompt_text" >&2
    read input_val
    
    if [ -z "$input_val" ]; then
        echo "$default"
    else
        echo "$input_val"
    fi
}

confirm_proceed() {
    local message=$1
    local default="y"
    local response
    
    response=$(prompt_input "$message" "y/n" "$default")
    response=$(echo "$response" | tr '[:upper:]' '[:lower:]')

    if [[ "$response" == "y" || "$response" == "yes" ]]; then
        return 0
    else
        echo -e "\n${ERR_CLR}✖ Operation aborted by user.${NC}"
        exit 1
    fi
}

show_summary() {
    echo -e "\n${BANNER_CLR}--- DEPLOYMENT SUMMARY ----------------------${NC}"
    print_kv "Worker " "$WORKER_NAME"
    print_kv "Env    " "$ENV"
    print_kv "Change " "$CHANGE"
    print_kv "Version" "$VERSION"
    echo -e "${BANNER_CLR}-----------------------------------------------${NC}"
}

# --- Logic ---

WORKER_NAME=""
ENV=""
CHANGE=""

print_banner "WORKER DEPLOYMENT AUTOMATION"

# 1. Parse flags
print_step "1/5" "PARSING ARGUMENTS"
while getopts "n:e:c:h" opt; do
  case ${opt} in
    n ) WORKER_NAME=$OPTARG; print_kv "Worker Name" "$WORKER_NAME" ;;
    e ) ENV=$OPTARG; print_kv "Environment" "$ENV" ;;
    c ) CHANGE=$OPTARG; print_kv "Change Type" "$CHANGE" ;;
    h | \? ) echo "Usage: $0 [-n name] [-e env] [-c change]"; exit 1 ;;
  esac
done

# 2. Config & Inputs
print_step "2/5" "CONFIGURATION & INPUTS"

if [ -z "$WORKER_NAME" ]; then
    WORKER_NAME=$(prompt_input "Enter worker name" "" "")
    [ -z "$WORKER_NAME" ] && print_error "Name is mandatory."
fi

if [ -z "$ENV" ]; then
    ENV=$(prompt_input "Select environment" "dev|stg|uat|pro" "dev")
fi

[[ ! "$ENV" =~ ^(dev|stg|uat|pro)$ ]] && print_error "Invalid environment ($ENV)."

if [ -z "$CHANGE" ]; then
    CHANGE=$(prompt_input "Select change type" "major|minor|patch|skip" "patch")
fi

# 3. Versioning (Local)
print_step "3/5" "LOCAL VERSION CONTROL"
if [ "$CHANGE" != "skip" ]; then
    print_warn "Bumping version locally... ($CHANGE)"
    
    VERSION=$(node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const v = pkg.version.split('.').map(Number);
        if('$CHANGE'==='major'){ v[0]++; v[1]=0; v[2]=0; }
        else if('$CHANGE'==='minor'){ v[1]++; v[2]=0; }
        else { v[2]++; }
        pkg.version = v.join('.');
        fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
        process.stdout.write(pkg.version);
    ")

    print_kv "New Version" "v$VERSION"
    git add package.json
    [ -f "package-lock.json" ] && git add package-lock.json
    git commit -m "chore($WORKER_NAME): bump version to $VERSION"
else
    print_warn "Skipping version update..."
    VERSION=$(node -p "require('./package.json').version")
fi

show_summary

# 4. Remote Sync (Push & Tag)
print_step "4/5" "REMOTE SYNC (PUSH & TAG)"
TAG_NAME="release/$WORKER_NAME/$ENV/$VERSION"
print_kv "Pending Tag" "$TAG_NAME"

echo ""
confirm_proceed "Push changes and update remote tag?"

if git ls-remote --tags origin | grep -q "refs/tags/$TAG_NAME"; then
    git push --delete origin "$TAG_NAME" || true
fi

if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    git tag -d "$TAG_NAME"
fi

git push origin HEAD
git tag "$TAG_NAME"
git push origin "$TAG_NAME"
print_warn "Remote repository updated successfully."

# 5. Deployment Execution
print_step "5/5" "DEPLOYMENT TO CLOUDFLARE"
print_kv "Target Env" "$ENV"

echo ""
confirm_proceed "Do you want to trigger the final deployment?"

npx wrangler deploy --env $ENV

show_summary