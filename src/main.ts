import * as core from '@actions/core'
// import {createCheckRun} from './github'
import {
  getTrxFiles,
  transformAllTrxToJson
} from './utils'

export async function run(): Promise<void> {
  try {
    const token = core.getInput('REPO_TOKEN')
    const trxPath = core.getInput('TRX_PATH')
    
    core.info(`Finding Trx files in: ${trxPath}`)
    const trxFiles = await getTrxFiles(trxPath)

    core.info(`Processing ${trxFiles.length} trx files`)
    const trxToJson = await transformAllTrxToJson(trxFiles)

    for (const _ of trxToJson) { }

    core.info(token);

    
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
