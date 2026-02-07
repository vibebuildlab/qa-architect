/**
 * Project maturity check command handler
 */

'use strict'

/**
 * Handle project maturity check command
 * @returns {void}
 */
function handleMaturityCheck() {
  const { ProjectMaturityDetector } = require('../project-maturity')
  const githubActions = process.argv.includes('--github-actions')
  const detector = new ProjectMaturityDetector({
    projectPath: process.cwd(),
    verbose: !githubActions,
  })

  if (githubActions) {
    const output = detector.generateGitHubActionsOutput()
    console.log(`maturity=${output.maturity}`)
    console.log(`source-count=${output.sourceCount}`)
    console.log(`test-count=${output.testCount}`)
    console.log(`has-deps=${output.hasDeps}`)
    console.log(`has-docs=${output.hasDocs}`)
    console.log(`has-css=${output.hasCss}`)
    console.log(`has-shell=${output.hasShell}`)
    console.log(`shell-count=${output.shellCount}`)
    console.log(`is-shell-project=${output.isShellProject}`)
    console.log(`required-checks=${output.requiredChecks}`)
    console.log(`optional-checks=${output.optionalChecks}`)
    console.log(`disabled-checks=${output.disabledChecks}`)
  } else {
    detector.printReport()
  }
  process.exit(0)
}

module.exports = { handleMaturityCheck }
