/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

export async function nodeSDKBuilder(): Promise<void> {
  const sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'observability-demo',
      [ATTR_SERVICE_VERSION]: '1.0',
    }),

    // Send trace to OTel collector for Tempo
    // traceExporter: new OTLPTraceExporter({
    //   url: 'http://tempo:4317',
    // }),

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
