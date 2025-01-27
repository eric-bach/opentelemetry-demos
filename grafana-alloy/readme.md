# grafana-otel

This application demonstrates the use of Grafana Dashboards for visualization anc correlation of telemetry data from a various backends:

- Grafana backends (Loki for logs, Tempo for traces, Mimir for metrics) using the Alloy collector with the OpenTelemetry API
- AWS backends (CloudWatch Logs for logs, X-Ray for traces, CloudWatch Metrics for metrics) using the build-in Grafana AWS Data Source
- Datadog backend (requires enterprise license, not implemented yet)

## Getting Started

1. Authenticate with AWS SSO

   ```
   aws sso login --profile PROFILE_NAME
   ```

2. Run the script to launch docker-compose.  
   The AWS SSO credentials are not being read by the docker container properly so this script exports the credentials as env variables for the docker container as a workaround

   ```
   ./docker-compose.sh
   ```

   At this point, the following containers should be spun up:

   ```
   docker compose ps
   ```

   2. If you're interested you can see the wal/blocks as they are being created.

   ```
   ls tempo-data/
   ```

   3. Navigate to [Grafana](http://localhost:3000/explore) select the Tempo data source and use the "Search"
      tab to find traces. Also notice that you can query Tempo metrics from the Prometheus data source setup in
      Grafana.

   4. To stop the setup

   ```
   docker compose down -v
   ```
