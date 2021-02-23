import * as github from '@actions/github'
import * as artifact from '@actions/artifact'
import * as core from '@actions/core'
import * as Webhooks from '@octokit/webhooks'
import {join, sep} from 'path'
import {tmpdir} from 'os'
import * as fs from 'fs'
import * as uitl from 'util'

export async function createArtifact(
  repoToken: string,
  artifactName: string,
  markupData: string,
  runId: string,
  repo: string
): Promise<string> {
  try {
    core.info(`Creating artifact`)

    const artifactClient = artifact.create()

    const tmpDir = tmpdir()

    const mkdtemp = uitl.promisify(fs.mkdtemp)
    const writeFile = uitl.promisify(fs.writeFile)

    const tempDir = await mkdtemp(`${tmpDir}${sep}`)
    const fileName = join(tempDir, artifactName)

    core.info(`storing artifact into ${fileName}`)

    await writeFile(fileName, markupData)
    await artifactClient.uploadArtifact(artifactName, [fileName], tempDir, {})

    const octokit = github.getOctokit(repoToken)

    const allArtifacts = await octokit.request(
      'GET /repos/{repo}/actions/runs/{run_id}/artifacts',
      {
        repo,
        run_id: runId
      }
    )

    for (const art of allArtifacts.data.artifacts) {
      if (art.name === artifactName) {
        return art.url
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }

  return 'unknown'
}

export async function createCheckRun(
  repoToken: string,
  markupData: string
): Promise<void> {
  try {
    core.info(`Creating PR check`)

    const octokit = github.getOctokit(repoToken)
    let git_sha = github.context.sha

    if (github.context.eventName === 'push') {
      core.info(`Creating status check for GitSha: ${git_sha} on a push event`)
    }

    if (github.context.eventName === 'pull_request') {
      const prPayload = github.context
        .payload as Webhooks.EventPayloads.WebhookPayloadPullRequest

      git_sha = prPayload.pull_request.head.sha
      core.info(
        `Creating status check for GitSha: ${git_sha} on a pull request event`
      )
    }

    const checkTime = new Date().toUTCString()
    core.info(`Check time is: ${checkTime}`)
    const response = await octokit.checks.create({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      name: 'trx-duration-report',
      head_sha: git_sha,
      status: 'completed',
      conclusion: 'neutral',
      output: {
        title: 'Unit test duration report',
        summary: `This test run completed at \`${checkTime}\``,
        text: markupData
      }
    })

    if (response.status !== 201) {
      throw new Error(
        `Failed to create status check. Error code: ${response.status}`
      )
    } else {
      core.info(
        `Created check: ${response.data.name} with response status ${response.status}`
      )
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}
