#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR"

echo "Starting Campus Buddy Services from $PROJECT_ROOT"

# Function to start a service
start_service() {
    SERVICE_NAME=$1
    SERVICE_PATH=$2
    PORT=$3
    
    echo "--------------------------------------------------"
    echo "Starting $SERVICE_NAME on port $PORT..."
    cd "$PROJECT_ROOT/$SERVICE_PATH"
    mvn spring-boot:run > startup.log 2>&1 &
    PID=$!
    echo "$SERVICE_NAME started with PID $PID"
}

# Start Services
start_service "Auth Service" "backend/auth-service" 8081
start_service "Academic Service" "backend/academic-service" 8082
start_service "Campus Service" "backend/campus-service" 8083
start_service "BFF Service" "backend/bff-service" 8080

echo "--------------------------------------------------"
echo "All backend services started."
echo "Logs are being written to 'startup.log' in each service directory."
echo "Please wait a few minutes for services to fully initialize."
echo "You can check the logs with: tail -f backend/*/startup.log"
