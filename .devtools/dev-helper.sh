#!/bin/bash

# Development Helper Script
# Provides quick access to common development tasks

COLOR_RESET='\033[0m'
COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_CYAN='\033[0;36m'

show_menu() {
    clear
    echo -e "${COLOR_CYAN}╔════════════════════════════════════════════╗${COLOR_RESET}"
    echo -e "${COLOR_CYAN}║     POL Growth Platform - Dev Helper      ║${COLOR_RESET}"
    echo -e "${COLOR_CYAN}╚════════════════════════════════════════════╝${COLOR_RESET}"
    echo ""
    echo -e "${COLOR_GREEN}Development:${COLOR_RESET}"
    echo "  1) Start dev server"
    echo "  2) Start with monitoring"
    echo "  3) Restart dev server"
    echo "  4) Clear cache & restart"
    echo ""
    echo -e "${COLOR_GREEN}Database:${COLOR_RESET}"
    echo "  5) Prisma Studio (DB viewer)"
    echo "  6) Regenerate Prisma client"
    echo "  7) Push schema changes"
    echo "  8) Reset database"
    echo ""
    echo -e "${COLOR_GREEN}Testing:${COLOR_RESET}"
    echo "  9) Run linter"
    echo " 10) Type check"
    echo " 11) Build check"
    echo ""
    echo -e "${COLOR_GREEN}Logs & Monitoring:${COLOR_RESET}"
    echo " 12) View dev server logs"
    echo " 13) View error logs"
    echo " 14) View all logs (tail -f)"
    echo " 15) Clear all logs"
    echo ""
    echo -e "${COLOR_GREEN}Utilities:${COLOR_RESET}"
    echo " 16) Check running processes"
    echo " 17) Kill all dev processes"
    echo " 18) Install dependencies"
    echo " 19) Update packages"
    echo ""
    echo "  0) Exit"
    echo ""
    echo -ne "${COLOR_YELLOW}Choose option: ${COLOR_RESET}"
}

start_dev() {
    echo -e "${COLOR_BLUE}Starting dev server...${COLOR_RESET}"
    npm run dev
}

start_with_monitoring() {
    echo -e "${COLOR_BLUE}Starting dev server with monitoring...${COLOR_RESET}"

    # Start dev server in background
    npm run dev > dev-server.log 2>&1 &
    DEV_PID=$!

    # Start dev monitor
    ./monitor-dev.sh &
    MONITOR_PID=$!

    # Start error monitor
    node monitor-errors.js &
    ERROR_PID=$!

    echo -e "${COLOR_GREEN}✓ Dev server started (PID: $DEV_PID)${COLOR_RESET}"
    echo -e "${COLOR_GREEN}✓ Dev monitor started (PID: $MONITOR_PID)${COLOR_RESET}"
    echo -e "${COLOR_GREEN}✓ Error monitor started (PID: $ERROR_PID)${COLOR_RESET}"
    echo ""
    echo -e "${COLOR_YELLOW}Press Enter to return to menu...${COLOR_RESET}"
    read
}

restart_dev() {
    echo -e "${COLOR_YELLOW}Restarting dev server...${COLOR_RESET}"
    pkill -f "next dev" || true
    sleep 2
    npm run dev > dev-server.log 2>&1 &
    echo -e "${COLOR_GREEN}✓ Dev server restarted${COLOR_RESET}"
    sleep 2
}

clear_and_restart() {
    echo -e "${COLOR_YELLOW}Clearing cache and restarting...${COLOR_RESET}"
    pkill -f "next dev" || true
    rm -rf .next
    echo -e "${COLOR_GREEN}✓ Cache cleared${COLOR_RESET}"
    npm run dev > dev-server.log 2>&1 &
    echo -e "${COLOR_GREEN}✓ Dev server restarted${COLOR_RESET}"
    sleep 2
}

prisma_studio() {
    echo -e "${COLOR_BLUE}Opening Prisma Studio...${COLOR_RESET}"
    npx prisma studio
}

regenerate_prisma() {
    echo -e "${COLOR_BLUE}Regenerating Prisma client...${COLOR_RESET}"
    npx prisma generate
    echo -e "${COLOR_GREEN}✓ Prisma client regenerated${COLOR_RESET}"
    sleep 2
}

push_schema() {
    echo -e "${COLOR_BLUE}Pushing schema changes...${COLOR_RESET}"
    npx prisma db push
    echo -e "${COLOR_GREEN}✓ Schema pushed${COLOR_RESET}"
    sleep 2
}

reset_database() {
    echo -e "${COLOR_RED}⚠️  WARNING: This will reset the entire database!${COLOR_RESET}"
    echo -ne "${COLOR_YELLOW}Are you sure? (yes/no): ${COLOR_RESET}"
    read confirm
    if [ "$confirm" = "yes" ]; then
        npx prisma migrate reset
        echo -e "${COLOR_GREEN}✓ Database reset${COLOR_RESET}"
    else
        echo -e "${COLOR_YELLOW}Cancelled${COLOR_RESET}"
    fi
    sleep 2
}

run_lint() {
    echo -e "${COLOR_BLUE}Running linter...${COLOR_RESET}"
    npm run lint
    echo ""
    echo -e "${COLOR_YELLOW}Press Enter to continue...${COLOR_RESET}"
    read
}

type_check() {
    echo -e "${COLOR_BLUE}Running type check...${COLOR_RESET}"
    npx tsc --noEmit
    echo ""
    echo -e "${COLOR_YELLOW}Press Enter to continue...${COLOR_RESET}"
    read
}

build_check() {
    echo -e "${COLOR_BLUE}Running build check...${COLOR_RESET}"
    npm run build
    echo ""
    echo -e "${COLOR_YELLOW}Press Enter to continue...${COLOR_RESET}"
    read
}

view_dev_logs() {
    echo -e "${COLOR_BLUE}Dev server logs (Ctrl+C to exit):${COLOR_RESET}"
    tail -f dev-server.log 2>/dev/null || echo "No dev-server.log found"
}

view_error_logs() {
    echo -e "${COLOR_BLUE}Error logs (Ctrl+C to exit):${COLOR_RESET}"
    tail -f error-monitor.log 2>/dev/null || echo "No error-monitor.log found"
}

view_all_logs() {
    echo -e "${COLOR_BLUE}All logs (Ctrl+C to exit):${COLOR_RESET}"
    tail -f dev-server.log dev-server-monitor.log error-monitor.log 2>/dev/null
}

clear_logs() {
    echo -e "${COLOR_YELLOW}Clearing all logs...${COLOR_RESET}"
    > dev-server.log 2>/dev/null
    > dev-server-monitor.log 2>/dev/null
    > error-monitor.log 2>/dev/null
    echo -e "${COLOR_GREEN}✓ Logs cleared${COLOR_RESET}"
    sleep 1
}

check_processes() {
    echo -e "${COLOR_BLUE}Running processes:${COLOR_RESET}"
    echo ""
    echo -e "${COLOR_CYAN}Next.js dev server:${COLOR_RESET}"
    pgrep -fl "next dev" || echo "  Not running"
    echo ""
    echo -e "${COLOR_CYAN}Monitor scripts:${COLOR_RESET}"
    pgrep -fl "monitor" || echo "  Not running"
    echo ""
    echo -e "${COLOR_CYAN}Port 3000:${COLOR_RESET}"
    lsof -ti:3000 || echo "  Not in use"
    echo ""
    echo -e "${COLOR_YELLOW}Press Enter to continue...${COLOR_RESET}"
    read
}

kill_all() {
    echo -e "${COLOR_RED}Killing all dev processes...${COLOR_RESET}"
    pkill -f "next dev" || true
    pkill -f "monitor" || true
    pkill -f "node.*monitor" || true
    echo -e "${COLOR_GREEN}✓ All processes killed${COLOR_RESET}"
    sleep 2
}

install_deps() {
    echo -e "${COLOR_BLUE}Installing dependencies...${COLOR_RESET}"
    npm install
    echo -e "${COLOR_GREEN}✓ Dependencies installed${COLOR_RESET}"
    sleep 2
}

update_packages() {
    echo -e "${COLOR_BLUE}Updating packages...${COLOR_RESET}"
    npm update
    echo -e "${COLOR_GREEN}✓ Packages updated${COLOR_RESET}"
    sleep 2
}

# Main loop
while true; do
    show_menu
    read choice

    case $choice in
        1) start_dev ;;
        2) start_with_monitoring ;;
        3) restart_dev ;;
        4) clear_and_restart ;;
        5) prisma_studio ;;
        6) regenerate_prisma ;;
        7) push_schema ;;
        8) reset_database ;;
        9) run_lint ;;
        10) type_check ;;
        11) build_check ;;
        12) view_dev_logs ;;
        13) view_error_logs ;;
        14) view_all_logs ;;
        15) clear_logs ;;
        16) check_processes ;;
        17) kill_all ;;
        18) install_deps ;;
        19) update_packages ;;
        0)
            echo -e "${COLOR_GREEN}Goodbye!${COLOR_RESET}"
            exit 0
            ;;
        *)
            echo -e "${COLOR_RED}Invalid option${COLOR_RESET}"
            sleep 1
            ;;
    esac
done
