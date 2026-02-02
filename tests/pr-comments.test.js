#!/usr/bin/env node

/**
 * Tests for --pr-comments flag (Issue #65)
 * Verifies actionable PR comments with BLOCKING/WARNINGS classification
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

console.log('🧪 Testing --pr-comments flag...\n')

function createTempGitRepo() {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-pr-comments-'))
  execSync('git init', { cwd: testDir, stdio: 'ignore' })
  execSync('git config user.email "test@example.com"', {
    cwd: testDir,
    stdio: 'ignore',
  })
  execSync('git config user.name "Test User"', {
    cwd: testDir,
    stdio: 'ignore',
  })

  fs.writeFileSync(
    path.join(testDir, 'package.json'),
    JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
  )
  fs.mkdirSync(path.join(testDir, 'src'), { recursive: true })
  fs.writeFileSync(path.join(testDir, 'src', 'index.js'), 'console.log("test")')
  fs.mkdirSync(path.join(testDir, 'tests'), { recursive: true })
  fs.writeFileSync(
    path.join(testDir, 'tests', 'test.js'),
    'const assert = require("assert")'
  )

  return testDir
}

const setupPath = path.join(__dirname, '../setup.js')

// Test 1: --pr-comments injects actionable comment step
;(() => {
  console.log('Test 1: --pr-comments injects actionable comment step')
  const testDir = createTempGitRepo()

  try {
    execSync(`QAA_DEVELOPER=true node ${setupPath} --pr-comments`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    assert(fs.existsSync(workflowPath), 'Workflow file should exist')

    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(
      content.includes('Post actionable PR comment'),
      'Should have actionable PR comment step'
    )

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 2: PR comment includes BLOCKING/WARNINGS sections
;(() => {
  console.log('Test 2: PR comment includes BLOCKING/WARNINGS classification')
  const testDir = createTempGitRepo()

  try {
    execSync(`QAA_DEVELOPER=true node ${setupPath} --pr-comments`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(
      content.includes('BLOCKING'),
      'Should reference BLOCKING classification'
    )
    assert(
      content.includes('WARNINGS'),
      'Should reference WARNINGS classification'
    )
    assert(content.includes('Passed'), 'Should reference Passed section')

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 3: Uses gh pr comment (not actions/github-script)
;(() => {
  console.log('Test 3: Uses gh pr comment instead of actions/github-script')
  const testDir = createTempGitRepo()

  try {
    execSync(`QAA_DEVELOPER=true node ${setupPath} --pr-comments`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(content.includes('gh pr comment'), 'Should use gh pr comment')
    assert(
      !content.includes('actions/github-script'),
      'Should NOT use actions/github-script'
    )
    assert(
      content.includes('--edit-last'),
      'Should use --edit-last to avoid spam'
    )

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 4: Uses env vars for injection prevention
;(() => {
  console.log('Test 4: Uses env vars for injection prevention')
  const testDir = createTempGitRepo()

  try {
    execSync(`QAA_DEVELOPER=true node ${setupPath} --pr-comments`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(content.includes('env:'), 'Should use env block')
    assert(content.includes('GH_TOKEN:'), 'Should pass GH_TOKEN via env')
    assert(content.includes('PR_NUMBER:'), 'Should pass PR_NUMBER via env')
    assert(
      content.includes('TESTS_RESULT:'),
      'Should pass TESTS_RESULT via env'
    )

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 5: Without --pr-comments, placeholder replaced with comment
;(() => {
  console.log(
    'Test 5: Without --pr-comments, placeholder replaced with comment'
  )
  const testDir = createTempGitRepo()

  try {
    execSync(`QAA_DEVELOPER=true node ${setupPath}`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(
      !content.includes('# PR_COMMENTS_PLACEHOLDER'),
      'Placeholder should be replaced'
    )
    assert(
      content.includes('PR comment step not enabled'),
      'Should have disabled comment'
    )
    assert(
      !content.includes('gh pr comment'),
      'Should NOT have gh pr comment when disabled'
    )

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 6: Package manager detection in PR comment
;(() => {
  console.log('Test 6: PR comment includes package manager detection')
  const testDir = createTempGitRepo()

  try {
    execSync(`QAA_DEVELOPER=true node ${setupPath} --pr-comments`, {
      cwd: testDir,
      stdio: 'pipe',
    })

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(content.includes('pnpm-lock.yaml'), 'Should detect pnpm')
    assert(content.includes('yarn.lock'), 'Should detect yarn')
    assert(content.includes('bun.lockb'), 'Should detect bun')

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

console.log('✅ All pr-comments tests passed!')
