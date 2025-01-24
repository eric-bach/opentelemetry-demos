import dotenv from 'dotenv';
import express, { Express } from 'express';
import opentelemetry, { metrics, trace, Span, context } from '@opentelemetry/api';
import { logger, nodeSDKBuilder } from './instrumentation';

dotenv.config();

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();

const tracer = trace.getTracer('observability-app-tracer');
const meter = metrics.getMeter('observability-app-meter');
const common_attributes = { signal: 'metric', language: 'javascript', metricType: 'random' };
const counter = meter.createCounter('lib.flights', {
  description: 'The number of flights',
  unit: '1',
});

// Add a delay inside doSomething function
const doSomething = async (parentSpan: Span) => {
  const ctx = opentelemetry.trace.setSpan(context.active(), parentSpan);

  const childSpan = tracer.startSpan(
    'doSomething',
    {
      attributes: { 'code.function': 'doSomething' },
    },
    ctx
  );

  return new Promise((resolve) => setTimeout(resolve, Math.random() * 800)).then(() => {
    // Do something busy

    childSpan.end();
  });
};

app.get('/flights', async (req, res) => {
  let result = [{ flightId: 1 }, { flightId: 2 }, { flightId: 3 }];

  logger.emit({
    severityText: 'INFO',
    body: 'getFlights',
  });
  counter.add(3, common_attributes);

  await tracer.startActiveSpan('getFlights', async (span: Span) => {
    const parentSpan = trace.getSpan(context.active());

    if (parentSpan) {
      await doSomething(parentSpan);
    }

    span.end();
  });

  res.send(JSON.stringify(result));
});

app.get('/flights/:flightId', async (req, res) => {
  const flightId = parseInt(req.params.flightId);

  logger.emit({
    severityText: 'INFO',
    body: 'getFlightById',
    attributes: {
      flightId: flightId,
    },
  });
  counter.add(1, common_attributes);

  let result = { flightId: flightId };

  await tracer.startActiveSpan('getFlightById', async (span: Span) => {
    span.setAttribute('flightId', flightId);

    //result = await getFlightById(flightId);

    const parentSpan = trace.getSpan(context.active());
    if (parentSpan) {
      await doSomething(parentSpan);
    }

    span.end();
  });

  res.send(JSON.stringify(result));
});

// wait for initialization of nodesdk (metric and trace provider) and then start random and request based metric generation
nodeSDKBuilder().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
  });

  // // Use setInterval to create a trace every 1 second
  // setInterval(() => {
  //   console.log('Creating a trace...');
  //   createTrace();
  // }, 1000);
});
