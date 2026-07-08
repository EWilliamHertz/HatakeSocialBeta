#!/bin/bash
# Set memory optimizations
export NODE_ENV="production"
export NODE_OPTIONS="--max-old-space-size=96"
export MALLOC_ARENA_MAX=1

# Start Phase Server in the background
cd /app/phase-engine
/usr/local/bin/phase-server &
PHASE_PID=$!

# Start Next.js in the foreground
cd /app
node server.js &
NEXT_PID=$!

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
