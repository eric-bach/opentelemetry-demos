# aws-adot

This application demonstrates the use of the OpenTelemety API with ADOT (AWS Distribution for OpenTelemetry) to send metrics, logs, and traces to AWS CloudWatch/X-Ray

## Getting Started

1. Authenticate with AWS SSO

   ```
   aws sso login --profile PROFILE_NAME
   ```

2. Run the script to launch docker-compose.  
   The AWS SSO credentials are not being read by the ADOT docker container properly so this script exports the credentials as env variables for the docker container as a workaround

   ```
   ./docker-compose.sh
   ```

## Reference

### Intialize manual instrumentation

https://opentelemetry.io/docs/languages/js/instrumentation/#manual-instrumentation-setup

1. Install OpenTelemetry API packages

   ```
   npm install @opentelemetry/api @opentelemetry/resources @opentelemetry/semantic-conventions
   npm install @opentelemetry/sdk-node
   ```

2. Create an instrumentation.ts

   ```
   /*instrumentation.ts*/
   import { NodeSDK } from '@opentelemetry/sdk-node';
   import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
   import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
   import { Resource } from '@opentelemetry/resources';
   import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

   const sdk = new NodeSDK({
       resource: new Resource({
           [ATTR_SERVICE_NAME]: 'yourServiceName',
           [ATTR_SERVICE_VERSION]: '0.1.0',
       }),
       traceExporter: new ConsoleSpanExporter(),
       metricReader: new PeriodicExportingMetricReader({
           exporter: new ConsoleMetricExporter(),
       }),
   });

   sdk.start();
   ```

### Initialize manual tracing and ADOT Exporter to AWS X-Ray

https://opentelemetry.io/docs/languages/js/instrumentation/#initialize-tracing

1.  Install OpenTelemetry trace packages

    ```
    npm install @opentelemetry/sdk-trace-web @opentelemetry/exporter-trace-otlp-grpc
    ```

2.  Install ADOT packages for AWS X-Ray

    ```
    npm install @aws/otel-aws-xray-propagator @opentelemetry/id-generator-aws-xray
    @opentelemetry/instrumentation-aws-sdk @opentelemetry/instrumentation-http @opentelemetry/propagator-aws-xray

    ```

3.  Update instrumentation.ts to include tracing to AWS X-Ray

    ```
    import { NodeSDK } from '@opentelemetry/sdk-node';
    import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
    import { Resource } from '@opentelemetry/resources';
    import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
    import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
    import { AWSXRayPropagator } from '@aws/otel-aws-xray-propagator';
    import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
    import { AwsInstrumentation } from '@opentelemetry/instrumentation-aws-sdk';

    const _traceExporter = new OTLPTraceExporter({
        url: 'http://adot-collector:4317',
    });

    const sdk = new NodeSDK({
        resource: new Resource({
            [ATTR_SERVICE_NAME]: 'yourServiceName',
            [ATTR_SERVICE_VERSION]: '0.1.0',
        }),

        textMapPropagator: new AWSXRayPropagator(),
        instrumentations: [
            new HttpInstrumentation(),
            new AwsInstrumentation({
            suppressInternalInstrumentation: true,
            }),
        ],
        spanProcessors: [new BatchSpanProcessor(_traceExporter)],
        traceExporter: _traceExporter,
    });

    sdk.start();

    ```

4.  Configure OpenTelemetry Exporters

    ```
    // otel-config.yaml
    receivers:
        otlp:
            protocols:
            grpc:
                endpoint: 0.0.0.0:4317
            http:
                endpoint: 0.0.0.0:4318

    processors:
        batch:
            timeout: 1s
            send_batch_size: 1024

    exporters:
        debug:
            verbosity: detailed
        awsxray:
            region: ${AWS_REGION}

    service:
        pipelines:
            traces:
                receivers: [otlp]
                processors: [batch]
                exporters: [awsxray, debug]
    ```

5.  Create spans

    ```
    return tracer.startActiveSpan('SomeActivity', { attributes: { 'MyAttribute': 'Working Hard' } }, (span: Span) => {
        span.setAttribute(SEMATTRS_CODE_FUNCTION, 'DoSomething');
        span.setAttribute(SEMATTRS_CODE_FILEPATH, __filename);

        // Do something

        span.end();
    });
    ```

### Initialize manual metrics instrumentation and ADOT Exporter to AWS CloudWatch Metrics

https://opentelemetry.io/docs/languages/js/instrumentation/#metrics

1.  Install OpenTelemetry metrics packages

    ```
    npm install @opentelemetry/sdk-metrics
    ```

2.  Install ADOT packages for AWS CloudWatch Metrics
    npm instlal @opentelemetry/exporter-metrics-otlp-grpc

3.  Update instrumentation.ts

    ```
    const sdk = new NodeSDK({
        // existing code

        // Metrics
        metricReader: new PeriodicExportingMetricReader({
            exporter: new OTLPMetricExporter(),
            exportIntervalMillis: 10000,
        }),
    });
    ```

4.  Configure OpenTelemetry Exporters

    ```
    // otel-config.yaml
    receivers:
        otlp:
            protocols:
            grpc:
                endpoint: 0.0.0.0:4317
            http:
                endpoint: 0.0.0.0:4318

    processors:
        batch:
            timeout: 1s
            send_batch_size: 1024

    exporters:
        debug:
            verbosity: detailed
        awsxray:
            region: ${AWS_REGION}
        awsemf:
            region: ${AWS_REGION}
            log_group_name: '/aws/observability-dice-demo'
            log_stream_name: 'application-metrics'

    service:
        pipelines:
            traces:
                receivers: [otlp]
                processors: [batch]
                exporters: [awsxray, debug]
            metrics:
                receivers: [otlp]
                processors: [batch]
                exporters: [awsemf]
    ```

## Initialize manual log instrumentation and ADOT Exporter to AWS CloudWatch Logs

1.  Install OpenTelemetry logs packages

    ```
    npm install @opentelemetry/sdk-logs
    ```

2.  Install ADOT packages for AWS CloudWatch Logs
    npm instlal @opentelemetry/exporter-logs-otlp-grpc

3.  Update instrumentation.ts

        ```
        const loggerProvider = new LoggerProvider({
            resource: new Resource({
                [ATTR_SERVICE_NAME] 'observability-demo-logger',
            }),
        });

        const logRecordProcessor = new SimpleLogRecordProcessor(
            new OTLPLogExporter({
                url: 'http://adot-collector:4317',
            })
        );

        loggerProvider.addLogRecordProcessor(logRecordProcessor);
        const logger = loggerProvider.getLogger('observability-demo-logger');

        logger.emit({
            severityText: 'INFO',
            body: 'Hello, I'm doing something',
        });

        ```

4.  Configure OpenTelemetry Exporters

    ```
    receivers:
    otlp:
        protocols:
        grpc:
            endpoint: 0.0.0.0:4317
        http:
            endpoint: 0.0.0.0:4318

    processors:
    batch:
        timeout: 1s
        send_batch_size: 1024

    exporters:
    debug:
        verbosity: detailed
    awsxray:
        region: ${AWS_REGION}
    awsemf:
        region: ${AWS_REGION}
        log_group_name: '/aws/observability-dice-demo'
        log_stream_name: 'application-metrics'
    awscloudwatchlogs:
        region: ${AWS_REGION}
        log_group_name: '/aws/observability-dice-demo'
        log_stream_name: 'application-logs'

    extensions:
    health_check:
        endpoint: 0.0.0.0:13133
    pprof:
        endpoint: 0.0.0.0:1777

    service:
    extensions: [health_check, pprof]
    pipelines:
        traces:
        receivers: [otlp]
        processors: [batch]
        exporters: [awsxray, debug]
        metrics:
        receivers: [otlp]
        processors: [batch]
        exporters: [awsemf]
        logs:
        receivers: [otlp]
        processors: [batch]
        exporters: [awscloudwatchlogs, debug]
    ```
