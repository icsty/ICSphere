const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

const exported = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/registrationValidation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exported })
const { validateInstitutionalEmail, validateStudentName, validateStudentNumber } = exported

// Synthetic fixtures only; no personal details from the supplied document.
test('RTU student emails normalize surrounding whitespace and domain casing', () => {
  const result = validateInstitutionalEmail(' 2020-000001@RTU.EDU.PH ')
  assert.equal(result.value, '2020-000001@rtu.edu.ph')
  assert.equal(result.error, null)
})

test('student email rules reject external domains, aliases, lookalikes, and malformed identifiers', () => {
  for (const value of [null, {}, '', 'student@rtu.edu.ph', '202X-XXXXXX@rtu.edu.ph', '2020-000001@gmail.com',
    '2020-000001@rtu.edu.ph.example.com', '2020-000001+alias@rtu.edu.ph', '2020-000001@student.rtu.edu.ph',
    '2020-00000@rtu.edu.ph', '2020-0000001@rtu.edu.ph', '2020-000001@rtu.edu.pһ', '2020-000001\u200b@rtu.edu.ph']) {
    assert.ok(validateInstitutionalEmail(value).error)
  }
})

test('student number validation requires the supplied format and matches the authenticated email', () => {
  const result = validateStudentNumber(' 2020-000001 ', '2020-000001@rtu.edu.ph')
  assert.equal(result.error, null)
  assert.equal(result.value, '2020-000001')
  assert.ok(validateStudentNumber('2020-000002', '2020-000001@rtu.edu.ph').error)
  assert.ok(validateStudentNumber('2020-000001', 'student@example.com').error)
  for (const value of [undefined, '2020/000001', '2020-00001', '2020-000001; DROP TABLE students', '2020-000001\n2020-000002']) {
    assert.ok(validateStudentNumber(value).error)
  }
})

test('name normalization preserves legitimate accents, initials, commas, and hyphens', () => {
  const result = validateStudentName('  Dela   Cruz, Mari\u0301a-Jose\u0301 O\u2019Brien Jr.  ')
  assert.equal(result.error, null)
  assert.equal(result.value, 'Dela Cruz, Mar\u00eda-Jos\u00e9 O\u2019Brien Jr.')
  assert.equal(validateStudentName("O'Brien, Ana").error, null)
})

test('invalid names are rejected rather than silently stripping markup or hidden characters', () => {
  for (const value of [null, [], '', '123456', '---', '<script>alert(1)</script>', 'Name\u0000', 'Name\u202e', 'First\nLast', 'A'.repeat(151)]) {
    assert.ok(validateStudentName(value).error)
  }
})
