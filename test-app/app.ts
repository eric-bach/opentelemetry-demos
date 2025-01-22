import dotenv from 'dotenv';
import express, { Express } from 'express';
import { trace, Span, context } from '@opentelemetry/api';
import { nodeSDKBuilder } from './instrumentation';
import { getFlightById, getFlights } from './dao';

dotenv.config();

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();

const tracer = trace.getTracer('observability-app-tracer');

// Add a delay inside doSomething function
const doSomething = async () => {
  const childSpan = tracer.startSpan(
    'doSomething',
    {
      attributes: { 'code.function': 'doSomething' },
    },
    context.active()
  );

  return new Promise((resolve) => setTimeout(resolve, Math.random() * 800)).then(() => {
    // Do something busy

    childSpan.end();
  });
};

app.get('/flights', async (req, res) => {
  let result;

  await tracer.startActiveSpan('getFlights', async (span: Span) => {
    result = await getFlights();

    await doSomething();

    span.end();
  });

  res.send(JSON.stringify(result));
});

app.get('/flights/:flightId', async (req, res) => {
  const flightId = parseInt(req.params.flightId);

  let result;

  await tracer.startActiveSpan('getFlightById', async (span: Span) => {
    span.setAttribute('flightId', flightId);

    result = await getFlightById(flightId);

    await doSomething();

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
