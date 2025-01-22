/*dice.ts*/
import { trace, Span, metrics } from '@opentelemetry/api';
import { SEMATTRS_CODE_FUNCTION, SEMATTRS_CODE_FILEPATH } from '@opentelemetry/semantic-conventions';
import { logger } from './instrumentation';

const meter = metrics.getMeter('dice-lib');
const tracer = trace.getTracer('dice-lib');

const common_attributes = { signal: 'metric', language: 'javascript', metricType: 'random' };
const counter = meter.createCounter('dice-lib.rolls.counter', {
  description: 'The number of rolls by roll value',
  unit: '1',
});

function rollOneDie(i: number, min: number, max: number) {
  return tracer.startActiveSpan(`rollDie: ${i}`, (span: Span) => {
    counter.add(10, common_attributes);

    const result = Math.floor(Math.random() * (max - min + 1) + min);

    logger.emit({
      severityText: 'INFO',
      body: `rollOneDie: ${i}`,
      attributes: { 'dicelib.rolled': `dice ${i.toString()} rolled ${result.toString()}` },
    });

    // Add an attribute to the span
    span.setAttribute('dicelib.rolled', result.toString());

    span.end();
    return result;
  });
}

export function rollDice(rolls: number, min: number, max: number) {
  // Create a span. A span must be closed.
  return tracer.startActiveSpan('rollDice', { attributes: { 'dicelib.rolls': rolls.toString() } }, (span: Span) => {
    span.setAttribute(SEMATTRS_CODE_FUNCTION, 'rollDice');
    span.setAttribute(SEMATTRS_CODE_FILEPATH, __filename);

    logger.emit({
      severityText: 'INFO',
      body: `rollDice: roll ${rolls} dice`,
      attributes: { 'dicelib.rollDice': rolls.toString() },
    });

    const result: number[] = [];
    for (let i = 0; i < rolls; i++) {
      result.push(rollOneDie(i, min, max));
    }

    // Be sure to end the span
    span.end();
    return result;
  });
}
