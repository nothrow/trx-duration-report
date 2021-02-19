import * as github from '@actions/github'
import * as core from '@actions/core'
import * as Webhooks from '@octokit/webhooks'

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
