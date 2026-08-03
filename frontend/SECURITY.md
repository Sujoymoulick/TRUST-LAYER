# Security Policy

## Supported Versions
We currently support and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability
If you discover a security vulnerability (such as leaked API keys, database exposure, or auth bypass), please **do not open a public issue.** Public issues alert everyone, including malicious actors, before a fix is ready.

Please report vulnerabilities by:
1. Sending an email to [Your Email Address]
2. Opening a "Private Vulnerability Report" via the GitHub Security tab if enabled.

### Our Response Process
- We will acknowledge your report within 48 hours.
- We will provide an estimated timeline for a fix.
- Once fixed, we will notify you and provide credit for the discovery (if desired).

## Important Reminder on Environment Variables
Never commit `.env` files to this repository. If you find a secret leaked in the history, please report it immediately so we can rotate the keys and purge the Git history.
