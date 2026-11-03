import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encode, decode, encodeComponent, decodeComponent } from '../src/index.js';

test('encodes ASCII letters and digits unchanged', () => {
  assert.equal(encode('abcXYZ019'), 'abcXYZ019');
});

test('encodes the unreserved punctuation set unchanged', () => {
  assert.equal(encode('-._~'), '-._~');
});

test('escapes reserved characters with uppercase hex', () => {
  assert.equal(encode('a b'), 'a%20b');
  assert.equal(encode('a/b?c=d&e'), 'a%2Fb%3Fc%3Dd%26e');
  assert.equal(encode("!*'()"), '%21%2A%27%28%29');
});

test('encodes multi-byte UTF-8 sequences byte by byte', () => {
  assert.equal(encode('é'), '%C3%A9');
  assert.equal(encode('€'), '%E2%82%AC');
  assert.equal(encode('😀'), '%F0%9F%98%80');
});

test('round-trips arbitrary strings', () => {
  const samples = [
    '',
    'hello world',
    'a%20b',
    '100% sure',
    'naïve café',
    '日本語',
    'emoji 😀🚀',
    '\u0000\u0001\u007f',
  ];
  for (const s of samples) {
    assert.equal(decode(encode(s)), s);
  }
});

test('decode accepts lowercase hex', () => {
  assert.equal(decode('%c3%a9'), 'é');
});

test('decode leaves malformed percent sequences literal', () => {
  assert.equal(decode('100%'), '100%');
  assert.equal(decode('%zz'), '%zz');
  assert.equal(decode('%2'), '%2');
});

test('decode replaces invalid UTF-8 bytes with U+FFFD', () => {
  assert.equal(decode('%FF'), '\uFFFD');
});

test('encodeComponent and decodeComponent mirror encode and decode', () => {
  assert.equal(encodeComponent('a b'), encode('a b'));
  assert.equal(decodeComponent('a%20b'), decode('a%20b'));
});

test('encode rejects non-strings', () => {
  assert.throws(() => encode(42), TypeError);
  assert.throws(() => encode(null), TypeError);
});

test('decode rejects non-strings', () => {
  assert.throws(() => decode({}), TypeError);
});

test('encodes a lone surrogate as the replacement character', () => {
  // TextEncoder follows the WHATWG encoding standard and substitutes U+FFFD.
  assert.equal(encode('\uD800'), '%EF%BF%BD');
});
