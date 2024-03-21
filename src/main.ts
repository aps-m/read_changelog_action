import * as core from '@actions/core'

import { ParseChangelog } from './changelogparser'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const changelogfile: string = core.getInput('changelogfile')

    const tag: string = core.getInput('tag')

    console.log(`Input filename: ${changelogfile} Tag: ${tag}`)

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`Input filename: ${changelogfile} Tag: ${tag}`)

    const result = ParseChangelog(changelogfile, tag)

    // Set outputs for other workflow steps to use
    core.setOutput('content', result)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
