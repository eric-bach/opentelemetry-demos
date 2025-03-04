# get-temp-creds.sh
#!/bin/bash

# Get temporary credentials from AWS SSO session
eval $(aws configure export-credentials --profile stage --format env)

# Start docker-compose with the temporary credentials
docker-compose -f docker-compose.yml up --build
