import express, { Express } from 'express';
import { trace, Span } from '@opentelemetry/api';
import { nodeSDKBuilder } from './instrumentation';

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();

const tracer = trace.getTracer('tracer-example');

function createTrace() {
  return tracer.startActiveSpan('my custom trace', (span: Span) => {
    // Add an attribute to the span
    span.setAttribute('my.attribute', 123);

    console.log('Creating a trace...');

    span.end();
  });
}

app.get('/', (req, res) => {
  res.send(JSON.stringify('Thanks for visiting!'));
  createTrace();
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
