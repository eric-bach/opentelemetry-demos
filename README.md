# OpenTelemetry Demos

This repository contains sample projects to demonstrate the use of OpenTelemetry to various observability backends

- `aws-adot` - Demonstrates the AWS Distribution for OpenTelemetry (ADOT) to export telemetry data to AWS CloudWatch/X-Ray
- `grafana-alloy` - Uses the Grafana Alloy collector to export telemetry data to Grafana backends

All the demos use docker-compose so ensure that Docker is setup.

The `grafana` demos use the `test-app` as the demo app

# ToDo

- Send traces to Alloy
- Send logs to Alloy
- Send metrics to Alloy
- Injest CloudWatch/X-Ray from an AWS account to Grafana dashboard

# References

### Tempo

- [Quick start for Tempo](https://grafana.com/docs/tempo/latest/getting-started/docker-example/)

### Loki

- [OpenTelemetry log implementation](https://npm.io/package/@opentelemetry/sdk-logs)
- [Send logs to Loki using local file watcher](https://grafana.com/docs/alloy/latest/tutorials/send-logs-to-loki/)
