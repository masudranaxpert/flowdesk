# Security

## Session tokens

Sessions are HMAC-SHA256 signed tokens (payload.signature) with a 30-day expiry.
The signing key is `AUTH_SECRET`, which has **no fallback** — the API refuses to
boot without it, so a misconfigured deployment fails loudly instead of silently
using a known dev key.

## Passwords

Passwords are hashed with **PBKDF2-SHA512, 100,000 iterations, 512-bit derived
keys** and a per-user 16-byte random salt. Verification uses constant-time
comparison throughout.

## Verification codes

Signup and password-reset codes are 6-digit, hashed at rest with an HMAC keyed by
`AUTH_SECRET`, and expire in 10 minutes.

## Error handling

Unhandled API errors log details server-side and return a generic
`Internal Server Error` to the client — internal messages are never leaked.

## Share links

Shares use random, unguessable codes. Bearer tokens are accepted via query string
only for endpoints that browsers cannot attach headers to (`<img>` sources and
downloads); everything else requires the `Authorization` header.

## Known trade-offs

- Verification codes are logged to the server console when `RESEND_API_KEY` is
  unset — intended for local development only.
- Tokens are not revocable before expiry; rotating `AUTH_SECRET` invalidates all
  sessions at once.
