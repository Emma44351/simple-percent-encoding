// Percent-encoding helpers operating at the byte level.
//
// Design decision: the library works on UTF-8 bytes, not JavaScript code units.
// `encodeURIComponent` also does this, but it leaves `!'()*` unescaped; we escape
// every byte outside the RFC 3986 unreserved set so the output is safe in any
// URL component (path segment, query value, fragment). The trade-off is that
// output is slightly longer than `encodeURIComponent` for those six characters,
// but it is unambiguous and round-trips through any parser.

const UNRESERVED = new Set();
for (let i = 0; i < 26; i++) {
  UNRESERVED.add(String.fromCharCode(0x41 + i)); // A-Z
  UNRESERVED.add(String.fromCharCode(0x61 + i)); // a-z
}
for (let i = 0; i < 10; i++) {
  UNRESERVED.add(String.fromCharCode(0x30 + i)); // 0-9
}
UNRESERVED.add('-');
UNRESERVED.add('.');
UNRESERVED.add('_');
UNRESERVED.add('~');

const HEX = '0123456789ABCDEF';

/**
 * Encode a string into a URL-safe percent-encoded representation.
 *
 * Every byte not in the RFC 3986 unreserved set is escaped as `%XX` with
 * uppercase hex digits. Input is interpreted as UTF-8, so astral characters
 * and lone surrogates are handled by the platform's TextEncoder (lone
 * surrogates become U+FFFD, matching the WHATWG encoding standard).
 *
 * @param {string} input
 * @returns {string}
 */
export function encode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('encode expects a string');
  }
  const bytes = new TextEncoder().encode(input);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const ch = String.fromCharCode(b);
    if (UNRESERVED.has(ch)) {
      out += ch;
    } else {
      out += '%' + HEX[(b >> 4) & 0x0f] + HEX[b & 0x0f];
    }
  }
  return out;
}

/**
 * Decode a percent-encoded string back into a JavaScript string.
 *
 * Accepts both uppercase and lowercase hex digits. A `%` not followed by two
 * hex digits is treated as a literal percent sign rather than an error; this
 * matches the lenient behaviour browsers use for malformed URLs and keeps the
 * function total. The decoded bytes are interpreted as UTF-8 (invalid
 * sequences become U+FFFD).
 *
 * @param {string} input
 * @returns {string}
 */
export function decode(input) {
  if (typeof input !== 'string') {
    throw new TypeError('decode expects a string');
  }
  const bytes = [];
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '%' && i + 2 < input.length + 1) {
      const hi = hexValue(input[i + 1]);
      const lo = hexValue(input[i + 2]);
      if (hi >= 0 && lo >= 0) {
        bytes.push((hi << 4) | lo);
        i += 2;
        continue;
      }
    }
    // Anything else is passed through as its UTF-8 bytes so that the
    // resulting byte array is a valid UTF-8 stream.
    const raw = new TextEncoder().encode(c);
    for (let j = 0; j < raw.length; j++) {
      bytes.push(raw[j]);
    }
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
}

/**
 * Alias for {@link encode}, kept for symmetry with `encodeURIComponent`.
 * @param {string} input
 * @returns {string}
 */
export function encodeComponent(input) {
  return encode(input);
}

/**
 * Alias for {@link decode}, kept for symmetry with `decodeURIComponent`.
 * @param {string} input
 * @returns {string}
 */
export function decodeComponent(input) {
  return decode(input);
}

function hexValue(ch) {
  if (ch === undefined) return -1;
  const code = ch.charCodeAt(0);
  if (code >= 0x30 && code <= 0x39) return code - 0x30; // 0-9
  if (code >= 0x41 && code <= 0x46) return code - 0x41 + 10; // A-F
  if (code >= 0x61 && code <= 0x66) return code - 0x61 + 10; // a-f
  return -1;
}
