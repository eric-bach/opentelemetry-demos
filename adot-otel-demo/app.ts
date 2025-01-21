/*app.ts*/
import express, { Express } from 'express';
import { rollDice } from './dice';
import { nodeSDKBuilder } from './instrumentation';
import { updateCpuUsageMetric, updateSizeMetric, updateThreadsActive, updateTimeAlive } from './random-metrics';

const PORT: number = parseInt(process.env.PORT || '8080');
const app: Express = express();

app.get('/rolldice', (req, res) => {
  const rolls = req.query.rolls ? parseInt(req.query.rolls.toString()) : NaN;
  if (isNaN(rolls)) {
    res.status(400).send("Request parameter 'rolls' is missing or not a number.");
    return;
  }
  res.send(JSON.stringify(rollDice(rolls, 1, 6)));
});

// wait for initialization of nodesdk (metric and trace provider) and then start random and request based metric generation
nodeSDKBuilder().then(() => {
  // request metrics generation
  app.listen(PORT, () => {
    console.log(`Listening for requests on http://localhost:${PORT}`);
  });

  // random metrics generation
  setInterval(() => {
    updateTimeAlive();
    updateThreadsActive();
    updateCpuUsageMetric();
    updateSizeMetric();
  }, 10000);
});
