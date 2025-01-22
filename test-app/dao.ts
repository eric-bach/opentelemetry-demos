import sql from 'mssql';
import { queryGetFlightById, queryGetAllFlights } from './queries';
import { context, SpanStatusCode, trace } from '@opentelemetry/api';

const config = {
  user: process.env.MS_DB_USER || '',
  password: process.env.MS_DB_PASSWORD || '',
  server: process.env.MS_DB_SERVER || '',
  database: process.env.MS_DB_NAME,
  port: 1433,
  connectionTimeout: 3000,
  requestTimeout: 3000,
  options: {
    enableArithAbort: true,
    encrypt: false,
  },
  pool: {
    max: 100,
    min: 1, //don't close all the connections.
    idleTimeoutMillis: 1000,
  },
};

const pool = new sql.ConnectionPool(config, (err) => {
  if (err) {
    console.error('SQL Connection Establishment ERROR: %s', err);
  } else {
    console.debug('SQL Connection established...');
  }
});

const tracer = trace.getTracer('observability-app-tracer');

export const getFlightById = async (flightId: number) => {
  const childSpan = tracer.startSpan(
    'getFlightById',
    {
      attributes: { 'code.function': 'getFlightById', 'db.flightId': flightId },
    },
    context.active()
  );

  const request = new sql.Request(pool);

  try {
    const result = await request
      .input('flightId', sql.Int, flightId)
      .input('appId', sql.Int, flightId)
      .query(queryGetFlightById());

    const data = result.recordset.at(0);

    if (!data) {
      throw new Error('No flight found with the provided ID');
    }

    return data;
  } catch (err: any) {
    childSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });

    console.error(err);
    return { error: err.message };
  } finally {
    childSpan.end();
  }
};

export const getFlights = async () => {
  const childSpan = tracer.startSpan(
    'getFlights',
    {
      attributes: { 'code.function': 'getFlights' },
    },
    context.active()
  );

  const request = new sql.Request(pool);

  try {
    const result = await request.query(queryGetAllFlights());

    return result.recordset;
  } catch (err: any) {
    childSpan.setStatus({ code: SpanStatusCode.ERROR, message: err.message });

    console.error(err);
    return { error: err.message };
  } finally {
    childSpan.end();
  }
};

console.debug('DAO initialized');
