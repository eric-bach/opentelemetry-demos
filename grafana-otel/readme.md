# grafana-otel

This application demonstrates the use of the OpenTelemety API with the OpenTelemetry collector to send metrics, logs, and traces to Grafana backends (Loki, Grafana, Tempo, Mimir)

## Getting Started

1. Start the stack

   ```
   docker compose up -d
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
