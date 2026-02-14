#!/bin/bash
echo "Registering..."
curl -v -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{"studentId":"S88888", "email":"debuguser2@example.com", "password":"password123", "role":"STUDENT"}'

echo -e "\n\nLogging in..."
curl -v -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"debuguser2@example.com", "password":"password123"}' > login_response.json

cat login_response.json
TOKEN=$(cat login_response.json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo -e "\nToken: $TOKEN"

echo -e "\nAccessing /api/auth/me..."
curl -v -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/auth/me
