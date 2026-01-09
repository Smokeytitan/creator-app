#!/bin/bash

# Configuration
PORT=3000
CHECK_INTERVAL=5  # seconds between checks
MAX_RETRIES=3
LOG_FILE="dev-server-monitor.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check if server is running
check_server() {
    curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT > /dev/null 2>&1
    return $?
}

# Function to check if port is in use
port_in_use() {
    lsof -ti:$PORT > /dev/null 2>&1
    return $?
}

# Function to kill existing process on port
kill_port() {
    local pid=$(lsof -ti:$PORT)
    if [ ! -z "$pid" ]; then
        log "${YELLOW}Killing existing process on port $PORT (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null
        sleep 2
    fi
}

# Function to start dev server
start_server() {
    log "${GREEN}Starting dev server...${NC}"
    cd /Users/ntruslow/projects/employee-x-growth-program
    npm run dev > dev-server.log 2>&1 &
    local server_pid=$!
    log "Dev server started with PID: $server_pid"

    # Wait for server to be ready
    local retry=0
    while [ $retry -lt $MAX_RETRIES ]; do
        sleep 3
        if port_in_use; then
            log "${GREEN}Dev server is online at http://localhost:$PORT${NC}"
            return 0
        fi
        retry=$((retry + 1))
        log "${YELLOW}Waiting for server to start... (attempt $retry/$MAX_RETRIES)${NC}"
    done

    log "${RED}Failed to start dev server after $MAX_RETRIES attempts${NC}"
    return 1
}

# Function to restart server
restart_server() {
    log "${YELLOW}Restarting dev server...${NC}"
    kill_port
    start_server
}

# Main monitoring loop
main() {
    log "${GREEN}========================================${NC}"
    log "${GREEN}Dev Server Monitor Started${NC}"
    log "${GREEN}Monitoring http://localhost:$PORT${NC}"
    log "${GREEN}Check interval: ${CHECK_INTERVAL}s${NC}"
    log "${GREEN}Press Ctrl+C to stop${NC}"
    log "${GREEN}========================================${NC}"

    # Kill any existing server and start fresh
    kill_port
    start_server

    local consecutive_failures=0

    while true; do
        sleep $CHECK_INTERVAL

        if port_in_use; then
            if [ $consecutive_failures -gt 0 ]; then
                log "${GREEN}Server recovered!${NC}"
                consecutive_failures=0
            fi
        else
            consecutive_failures=$((consecutive_failures + 1))
            log "${RED}Server down! (consecutive failures: $consecutive_failures)${NC}"

            if [ $consecutive_failures -ge 2 ]; then
                log "${RED}Server confirmed down. Attempting restart...${NC}"
                restart_server
                consecutive_failures=0
            fi
        fi
    done
}

# Cleanup on exit
cleanup() {
    log "${YELLOW}Monitor stopping...${NC}"
    log "${YELLOW}Leaving dev server running${NC}"
    log "Dev server monitor stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start monitoring
main
