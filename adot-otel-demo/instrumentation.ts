/*instrumentation.ts*/
import opentelemetry, { metrics } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { PeriodicExportingMetricReader, MeterProvider } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { AWSXRayPropagator } from '@aws/otel-aws-xray-propagator';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';

const ADOT_COLLETOR_URL = 'http://adot-collector:4317';

const resource = Resource.default().merge(
  new Resource({
    [ATTR_SERVICE_NAME]: 'observability-demo',
    [ATTR_SERVICE_VERSION]: '0.1.0',
  })
);

// Trace exporter
const traceExporter = new OTLPTraceExporter({
  url: ADOT_COLLETOR_URL,
});

// Metric exporter
const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({ url: ADOT_COLLETOR_URL }),
  exportIntervalMillis: 10000,
});

const myServiceMeterProvider = new MeterProvider({
  resource: resource,
  readers: [metricReader],
});

opentelemetry.metrics.setGlobalMeterProvider(myServiceMeterProvider);

// Log exporter
const loggerProvider = new LoggerProvider({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'observability-demo-logger',
  }),
});
const logRecordProcessor = new SimpleLogRecordProcessor(
  new OTLPLogExporter({
    url: ADOT_COLLETOR_URL,
  })
);
loggerProvider.addLogRecordProcessor(logRecordProcessor);
const logger = loggerProvider.getLogger('observability-demo-logger');

async function nodeSDKBuilder(): Promise<void> {
  const sdk = new NodeSDK({
    resource: resource,
    instrumentations: [new HttpInstrumentation(), new AwsInstrumentation({ suppressInternalInstrumentation: true })],

    // Traces
    textMapPropagator: new AWSXRayPropagator(),
    //spanProcessors: [new BatchSpanProcessor(_traceExporter)],
    traceExporter: traceExporter,

    // Metrics
    // metricReader: metricReader,

    // Logs
    logRecordProcessors: [logRecordProcessor],
  });

  sdk.start();

  // gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing and Metrics terminated'))
      .catch((error) => console.log('Error terminating tracing and metrics', error))
      .finally(() => process.exit(0));
  });
}

export { nodeSDKBuilder, logger };
