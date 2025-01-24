/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import opentelemetry from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader, MeterProvider } from '@opentelemetry/sdk-metrics';

import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

const SERVICE_NAME = 'observability-demo';
const resource = Resource.default().merge(
  new Resource({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: '0.1.0',
  })
);

// Setup OTel metrics
setupMetrics();

// Setup OTel logging
export const logger = setupLogger();

export async function nodeSDKBuilder(): Promise<void> {
  // Setup OTel tracing
  const sdk = new NodeSDK({
    resource,

    // Send trace to Console and OTel collector for Tempo
    spanProcessors: [
      new SimpleSpanProcessor(new ConsoleSpanExporter()),
      new SimpleSpanProcessor(new OTLPTraceExporter({ url: 'http://alloy:4317' })),
    ],
  });

  console.log('Starting OpenTelemetry SDK server for instrumentation...');

  sdk.start();

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK server terminated'))
      .catch((error) => console.log('Error terminating OpenTelemetry SDK server', error))
      .finally(() => process.exit(0));
  });
}

function setupMetrics() {
  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: 'http://alloy:4317' }),
    exportIntervalMillis: 10000,
  });

  const myServiceMeterProvider = new MeterProvider({
    resource: resource,
    readers: [metricReader],
  });

  opentelemetry.metrics.setGlobalMeterProvider(myServiceMeterProvider);
}

function setupLogger() {
  const loggerProvider = new LoggerProvider({ resource });
  const logRecordProcessor = new BatchLogRecordProcessor(new OTLPLogExporter({ url: 'http://alloy:4317' }));

  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  return loggerProvider.getLogger(SERVICE_NAME);
}
