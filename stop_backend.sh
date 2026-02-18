#!/bin/bash

# Function to stop a service on a specific port
stop_service() {
    PORT=$1
    SERVICE_NAME=$2
    
    PID=$(lsof -t -i:$PORT)
    
    if [ -n "$PID" ]; then
        echo "Stopping $SERVICE_NAME on port $PORT (PID: $PID)..."
        kill -9 $PID
        echo "$SERVICE_NAME stopped."
    else
        echo "$SERVICE_NAME is not running on port $PORT."
    fi
}

echo "Stopping Campus Buddy Backend Services..."
echo "--------------------------------------------------"

stop_service 8081 "Auth Service"
stop_service 8082 "Academic Service"
stop_service 8083 "Campus Service"
stop_service 8080 "BFF Service"

echo "--------------------------------------------------"
echo "All backend services stopped."
