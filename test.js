'use strict'
const test = require('ava')
const {execSync} = require('child_process')
const stream = require('./stream')

function fx(json, code = '') {
  return execSync(`echo '${JSON.stringify(json)}' | node index.js ${code}`).toString('utf8')
}

test('pass', t => {
  const r = fx([{"greeting": "hello world"}])
  t.deepEqual(JSON.parse(r), [{"greeting": "hello world"}])
})

test('anon func', t => {
  const r = fx({"key": "value"}, "'function (x) { return x.key }'")
  t.deepEqual(r, 'value\n')
})

test('arrow func', t => {
  const r = fx({"key": "value"}, "'x => x.key'")
  t.deepEqual(r, 'value\n')
})

test('arrow func ()', t => {
  const r = fx({"key": "value"}, "'(x) => x.key'")
  t.deepEqual(r, 'value\n')
})

test('this bind', t => {
  const r = fx([1, 2, 3, 4, 5], "'this.map(x => x * this.length)'")
  t.deepEqual(JSON.parse(r), [5, 10, 15, 20, 25])
})

test('generator', t => {
  const r = fx([1, 2, 3, 4, 5], "'for (let i of this) if (i % 2 == 0) yield i'")
  t.deepEqual(JSON.parse(r), [2, 4])
})

test('chain', t => {
  const r = fx({"items": ["foo", "bar"]}, "'this.items' 'yield* this' 'x => x[1]'")
  t.deepEqual(r, 'bar\n')
})

test('file argument', t => {
  const r = execSync(`node index.js package.json .name`).toString('utf8')
  t.deepEqual(r, 'fx\n')
})

test('stream', t => {
  const input = `
  {"index": 0} {"index": 1}
  {"index": 2, "quote": "\\""}
  {"index": 3} "Hello" "world"
  {"index": 6, "key": "one \\"two\\" three"}
  `
  t.plan(7 * (input.length - 1))

  for (let i = 0; i < input.length; i++) {
    const parts = [input.substring(0, i), input.substring(i)]

    const reader = stream(
      {
        read() {
          return parts.shift()
        }
      },
      json => {
        t.pass()
      }
    )

    reader.read()
  }
})
