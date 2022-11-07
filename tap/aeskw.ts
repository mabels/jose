import type QUnit from 'qunit'
import * as env from './env.js'
import type * as jose from '../src/index.js'
import random from './random.js'
import roundtrip from './encrypt.js'

export default (QUnit: QUnit, lib: typeof jose) => {
  const { module, test } = QUnit
  module('aeskw.ts')

  type Vector = [string, boolean]
  const algorithms: Vector[] = [
    ['A128KW', !env.isElectron],
    ['A192KW', !(env.isChromium || env.isElectron)],
    ['A256KW', !env.isElectron],
    ['A128GCMKW', true],
    ['A192GCMKW', !env.isChromium],
    ['A256GCMKW', true],
  ]

  function title(vector: Vector) {
    const [alg, works] = vector
    let result = ''
    if (!works) {
      result = '[not supported] '
    }
    result += `${alg}`
    return result
  }

  function secretsFor(alg: string) {
    return [lib.generateSecret(alg), random(parseInt(alg.slice(1, 4), 10) >> 3)]
  }

  for (const vector of algorithms) {
    const [alg, works] = vector

    const execute = async (t: typeof QUnit.assert) => {
      for await (const secret of secretsFor(alg)) {
        await roundtrip(t, lib, alg, 'A128GCM', secret)
      }
    }

    if (works) {
      test(title(vector), execute)
    } else {
      test(title(vector), async (t) => {
        await t.rejects(execute(t))
      })
    }
  }
}
