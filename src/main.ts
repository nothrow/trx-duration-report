import * as core from '@actions/core'
import { Results, TrxDataWrapper, UnitTestResult } from './types/types';
import {createCheckRun} from './github'
import { Timespan } from './timespan'
import {
  getTrxFiles,
  transformAllTrxToJson,
  getConfigValue,
  makeArray
} from './utils'
import { formatHistogram, formatStatistics, formatWorstTests } from './markup';

function getUnitTestResult(
  unitTestId: string,
  testResults: Results
): UnitTestResult | undefined {
  const unitTestResults = testResults.UnitTestResult

  if (Array.isArray(unitTestResults)) {
    return testResults.UnitTestResult.find(x => x._testId === unitTestId)
  }

  const result = unitTestResults as UnitTestResult
  return result
}


function processTests(data : TrxDataWrapper[])
{
  const rv = [];

  for (const fileData of data) {
    const unitTests = makeArray(fileData.TrxData.TestRun.TestDefinitions.UnitTest);
    for(const test of unitTests)
    {
      const testResult = getUnitTestResult(
        test._id,
        fileData.TrxData.TestRun.Results
      )

      rv.push({
        duration: Timespan.parse(testResult?._duration),
        className: test.TestMethod._className,
        testName: test.TestMethod._name,
        outcome: testResult?._outcome ?? 'undefined'
      });
    }
  }

  rv.sort((a, b) => b.duration - a.duration);

  return rv;
}

async function run(): Promise<void> {
  try {
    const token = getConfigValue('REPO_TOKEN');
    const trxPath = getConfigValue('TRX_PATH');
    
    core.info(`Finding Trx files in: ${trxPath}`)
    const trxFiles = await getTrxFiles(trxPath)

    core.info(`Processing ${trxFiles.length} trx files`)
    const trxToJson = await transformAllTrxToJson(trxFiles)

    const tests = processTests(trxToJson)

    const statistics = formatStatistics(tests)
    const worst10 = formatWorstTests(tests, 10)
    const histogram = formatHistogram(tests, 50)

    if (!token) {
      core.info(statistics)
      core.info(worst10)
      core.info(histogram)
    }
    else {
      createCheckRun(token, statistics + worst10 + histogram)
    }
    
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
