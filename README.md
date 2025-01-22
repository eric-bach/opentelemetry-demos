# OpenTelemetry Demos

This repository contains sample projects to demonstrate the use of OpenTelemetry to various observability backends

- `aws-adot` - Demonstrates the AWS Distribution for OpenTelemetry (ADOT) to export telemetry data to AWS CloudWatch/X-Ray
- `grafana-otel` - Uses the OpenTelemetry collector to export telemetry data to Grafana backends
- `grafana-alloy` - Uses the Grafana Alloy collector to export telemetry data to Grafana backends

All the demos use docker-compose so ensure that Docker is setup.

The `grafana` demos use the `test-app` as the demo app
