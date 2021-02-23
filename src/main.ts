import * as core from '@actions/core'
import {
  Results,
  TestPerformance,
  TrxDataWrapper,
  UnitTestResult
} from './types/types'
import {createArtifact, createCheckRun} from './github'
import {parseTime} from './timespan'
import {
  getTrxFiles,
  transformAllTrxToJson,
  getConfigValue,
  makeArray
} from './utils'
import {
  formatHistogram,
  formatHistogramUrl,
  formatStatistics,
  formatWorstTests
} from './markup'

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

function processTests(data: TrxDataWrapper[]): TestPerformance[] {
  const rv = []

  for (const fileData of data) {
    const unitTests = makeArray(
      fileData.TrxData.TestRun.TestDefinitions.UnitTest
    )
    for (const test of unitTests) {
      const testResult = getUnitTestResult(
        test._id,
        fileData.TrxData.TestRun.Results
      )

      rv.push({
        duration: parseTime(testResult?._duration),
        className: test.TestMethod._className,
        testName: test.TestMethod._name,
        outcome: testResult?._outcome ?? 'undefined'
      })
    }
  }

  rv.sort((a, b) => b.duration - a.duration)

  return rv
}

async function run(): Promise<void> {
  try {
    const token = getConfigValue('REPO_TOKEN')
    const trxPath = getConfigValue('TRX_PATH')

    const runId = getConfigValue('GITHUB_RUN_ID')
    const repo = getConfigValue('GITHUB_REPOSITORY')

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
    } else {
      const histogramUrl = await createArtifact(
        token,
        'trx-duration-report-histogram.svg',
        histogram,
        runId,
        repo
      )
      const histogramHtml = formatHistogramUrl(histogramUrl)
      await createCheckRun(token, statistics + worst10 + histogramHtml)
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
