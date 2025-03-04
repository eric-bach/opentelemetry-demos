/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS'" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */

'use strict';

import { metrics } from '@opentelemetry/api';

const TIME_ALIVE_METRIC = 'time_alive';
const CPU_USAGE_METRIC = 'cpu_usage';
const THREADS_ACTIVE_METRIC = 'threads_active';
const HEAP_SIZE_METRIC = 'total_heap_size';

const common_attributes = { signal: 'metric', language: 'javascript', metricType: 'random' };

let threadCount = 0;
let cpuUsage = 0;
let totalHeapSize = 0;

// acquire meter
const meter = metrics.getMeter('observability-demo');
let testingId = '';
if (process.env.INSTANCE_ID) {
  testingId = '_' + process.env.INSTANCE_ID;
}

// counter metric
const timeAliveMetric = meter.createCounter(TIME_ALIVE_METRIC + testingId, {
  description: 'Total amount of time that the application has been alive',
  unit: 's',
});

// updown counter metric
const threadsActiveMetric = meter.createUpDownCounter(THREADS_ACTIVE_METRIC + testingId, {
  description: 'The total number of threads active',
  unit: '1',
});

// observable gauge metric
const cpuUsageMetric = meter.createObservableGauge(CPU_USAGE_METRIC + testingId, {
  description: 'Cpu usage percent',
  unit: '1',
});
cpuUsageMetric.addCallback((measurement) => {
  measurement.observe(cpuUsage, common_attributes);
});

// observable updown counter metric
const totalHeapSizeMetric = meter.createObservableUpDownCounter(HEAP_SIZE_METRIC + testingId, {
  description: 'The current total heap size',
  unit: '1',
});
totalHeapSizeMetric.addCallback((measurement) => {
  measurement.observe(totalHeapSize, common_attributes);
});

// updates observable gauge
function updateCpuUsageMetric(): void {
  cpuUsage = Math.random() * 100; //cfg.RandomCpuUsageUpperBound;
}

// updates updown counter
function updateSizeMetric(): void {
  totalHeapSize += Math.random() * 100; // cfg.RandomTotalHeapSizeUpperBound;
}

// updates counter
function updateTimeAlive(): void {
  timeAliveMetric.add(1, common_attributes); //cfg.RandomTimeAliveIncrementer, common_attributes);
}

// updates updown counter metric
function updateThreadsActive(): void {
  const min = -1;
  const activeThreads = Math.floor(Math.random() * (100 - min + 1) + min); //cfg.RandomThreadsActiveUpperBound - min + 1) + min);

  if (threadCount < activeThreads) {
    threadsActiveMetric.add(1, common_attributes);
    threadCount++;
  } else {
    threadsActiveMetric.add(-1, common_attributes);
    threadCount--;
  }
}

export { updateTimeAlive, updateThreadsActive, updateCpuUsageMetric, updateSizeMetric };
