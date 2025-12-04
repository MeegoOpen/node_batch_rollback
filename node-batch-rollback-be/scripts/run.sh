#!/bin/bash

# Build the application
go build -o node_operator_standalone cmd/server/main.go

# Run the application
./node_operator_standalone