#!/usr/bin/env node

/**
 * Tests for --split-coverage flag (Issue #64)
 * Verifies that split coverage injects a non-blocking coverage step
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { execSync } = require('child_process')

console.log('🧪 Testing --split-coverage flag...\n')

function createTempGitRepo() {
  const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-split-cov-'))
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

// Test 1: --split-coverage injects coverage step with continue-on-error
;(() => {
  console.log(
    'Test 1: --split-coverage injects coverage step with continue-on-error'
  )
  const testDir = createTempGitRepo()

  try {
    execSync(`QAA_DEVELOPER=true node ${setupPath} --split-coverage`, {
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
      content.includes('Run coverage check'),
      'Should have coverage check step'
    )
    assert(
      content.includes('continue-on-error: true'),
      'Coverage step should have continue-on-error: true'
    )
    assert(
      content.includes('id: coverage'),
      'Coverage step should have output ID'
    )
    assert(
      content.includes('npm run test:coverage'),
      'Should run test:coverage command'
    )
    assert(
      content.includes('coverage-result='),
      'Should output coverage result'
    )

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 2: Without --split-coverage, placeholder is replaced with comment
;(() => {
  console.log(
    'Test 2: Without --split-coverage, placeholder replaced with comment'
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
    assert(fs.existsSync(workflowPath), 'Workflow file should exist')

    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(
      !content.includes('# SPLIT_COVERAGE_PLACEHOLDER'),
      'Placeholder should be replaced'
    )
    assert(
      content.includes('Split coverage not enabled'),
      'Should have disabled comment'
    )
    assert(
      !content.includes('Run coverage check'),
      'Should NOT have coverage check step when disabled'
    )

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

// Test 3: --split-coverage works with --workflow-standard
;(() => {
  console.log('Test 3: --split-coverage works with other flags')
  const testDir = createTempGitRepo()

  try {
    execSync(
      `QAA_DEVELOPER=true node ${setupPath} --split-coverage --workflow-standard`,
      { cwd: testDir, stdio: 'pipe' }
    )

    const workflowPath = path.join(
      testDir,
      '.github',
      'workflows',
      'quality.yml'
    )
    const content = fs.readFileSync(workflowPath, 'utf8')

    assert(
      content.includes('Run coverage check'),
      'Coverage step should exist with --workflow-standard'
    )
    assert(
      content.includes('continue-on-error: true'),
      'continue-on-error should be present'
    )

    console.log('  ✅ Pass\n')
  } finally {
    fs.rmSync(testDir, { recursive: true, force: true })
  }
})()

console.log('✅ All split-coverage tests passed!')
