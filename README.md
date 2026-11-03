# simple-percent-encoding

Encode and decode arbitrary strings into a URL-safe percent-escaped form using UTF-8 bytes.

```js
import { encode, decode } from 'simple-percent-encoding';

encode('a b/c?d=e');   // 'a%20b%2Fc%3Fd%3De'
decode('a%20b%2Fc%3Fd%3De'); // 'a b/c?d=e'
```

## Why this exists

`encodeURIComponent` is almost right, but it leaves `!'()*` unescaped. Those characters are
legal in a URI component but are also the ones that trip up naive parsers and template engines,
and they are not in the RFC 3986 unreserved set. This library escapes every byte outside
`A-Z a-z 0-9 - . _ ~`, so the output is unambiguous no matter where you paste it. The trade-off
is slightly longer output for those six characters; correctness beats brevity here.

The decoder is deliberately lenient: a `%` that is not followed by two hex digits is passed
through as a literal `%` instead of throwing. That matches what browsers do with malformed URLs
and keeps `decode` total, which is useful when the input comes from an untrusted source.

## API

- `encode(input: string): string` — percent-encode a string.
- `decode(input: string): string` — decode a percent-encoded string.
- `encodeComponent(input: string): string` — alias for `encode`.
- `decodeComponent(input: string): string` — alias for `decode`.

## The awkward edge

Percent-decoding can produce bytes that are not valid UTF-8. This library decodes them with
`TextDecoder` in non-fatal mode, so an invalid byte such as `%FF` becomes the Unicode replacement
character `U+FFFD` rather than throwing. If you need to reject malformed input, check the decoded
string for `\uFFFD` or use a stricter decoder.
