#!/bin/bash

# Start Auth Service
echo "Starting Auth Service..."
cd /Users/parth/Desktop/campus-buddy/backend/auth-service
mvn spring-boot:run > startup.log 2>&1 &
AUTH_PID=$!
echo "Auth Service started with PID $AUTH_PID"

# Start Academic Service
echo "Starting Academic Service..."
cd /Users/parth/Desktop/campus-buddy/backend/academic-service
mvn spring-boot:run > startup.log 2>&1 &
ACADEMIC_PID=$!
echo "Academic Service started with PID $ACADEMIC_PID"

# Start BFF Service
echo "Starting BFF Service..."
cd /Users/parth/Desktop/campus-buddy/backend/bff-service
mvn spring-boot:run > startup.log 2>&1 &
BFF_PID=$!
echo "BFF Service started with PID $BFF_PID"

echo "All services started. Logs are being written to startup.log in each service directory."
echo "Please wait a few minutes for services to fully initialize."
