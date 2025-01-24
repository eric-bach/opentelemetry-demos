/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';

const SERVICE_NAME = 'observability-demo';
const resource = Resource.default().merge(
  new Resource({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: '0.1.0',
  })
);

export const logger = setupLogger();

export async function nodeSDKBuilder(): Promise<void> {
  const sdk = new NodeSDK({
    resource,

    // Send trace to Console and OTel collector for Tempo
    spanProcessors: [
      new SimpleSpanProcessor(new ConsoleSpanExporter()),
      new SimpleSpanProcessor(
        new OTLPTraceExporter({
          url: 'http://tempo:4317',
        })
      ),
    ],
  });

  console.log('Starting instrumentation...');

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

export function setupLogger() {
  const loggerProvider = new LoggerProvider({ resource });
  const logRecordProcessor = new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: 'http://alloy:4317',
    })
  );

  loggerProvider.addLogRecordProcessor(logRecordProcessor);
  return loggerProvider.getLogger(SERVICE_NAME);
}
