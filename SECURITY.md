<div align="center">

# 🔐 Security Policy

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/license-PolyForm%20Noncommercial%201.0.0-blue.svg)](LICENSE) ![Version](https://img.shields.io/badge/version-1.1.0-blue.svg) ![Security policy](https://img.shields.io/badge/security-policy-red) ![Network](https://img.shields.io/badge/network-none-success)

</div>

## Supported versions

| Version | Supported |
|---|---|
| 1.x | ✅ |

## Scope — what this project is

**IDLE CITY — Ages of Growth** is a **fully client-side, offline** game distributed as a single
HTML file. By design it:

- runs entirely in the browser — there is **no backend or server component**;
- makes **no network requests** at runtime;
- collects **no data**, has **no analytics, tracking or telemetry**;
- stores progress **only in the browser's own `localStorage`** (save slots and settings);
- bundles **no third-party runtime code** and loads no external scripts, styles or fonts.

That dramatically narrows the attack surface, but the following are still worth reporting.

## What to report

Please report privately if you find:

- A **cross-site scripting (XSS)** issue — for example, a way to inject markup through a save
  code, an imported file, a player name or any other input.
- A **save-code / import** flaw that allows arbitrary code execution or corrupts data.
- A way for the page to **leak `localStorage`** or any local data to a third party.
- A **dependency** problem in the dev-only build tools (`terser`, `html-minifier-terser`).

General bugs, balance issues and cosmetic problems are **not** security issues — please file
those as a normal [issue](../../issues).

## How to report

**Do not open a public issue for a security problem.**

Use GitHub's private reporting instead:

1. Go to the repository's **Security** tab → **Report a vulnerability**, or
2. Open a draft [security advisory](../../security/advisories/new) with:
   - a description of the issue and its impact,
   - steps to reproduce (a minimal proof of concept helps a lot),
   - the browser/OS you tested on,
   - any suggested fix.

Please allow a reasonable amount of time for a response before any public disclosure. We aim to
acknowledge reports within a few days and will credit reporters in the fix's release notes
unless you prefer to stay anonymous.

## Safe harbour

Good-faith security research that respects user privacy and does not degrade the service for
others is welcome. Thank you for helping keep users safe.
