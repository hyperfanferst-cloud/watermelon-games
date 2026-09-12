# Game Hub starter

## Requirements
- Node.js 18+ recommended

## Run locally

1. Open a terminal in this folder.
2. Run:
   npm install
3. Set your access code (recommended):
   Windows PowerShell:
   `$env:ACCESS_CODE="your-secret-code"`
   `$env:SESSION_SECRET="use-a-long-random-secret"`
4. Start:
   `npm start`
5. Open http://localhost:3000

If you do not set ACCESS_CODE, the temporary default is `CHANGE-ME-1234`.

## How the protection works

The games page is `/games`, but it is not a public static file. Express checks the user's session before sending `private/games.html`.

Do not put the real access code in client-side JavaScript or HTML.

For an internet deployment:
- use HTTPS
- set a strong SESSION_SECRET
- set a strong ACCESS_CODE
- set the session cookie's `secure` option to true
- consider a real user account system if you need stronger security

This starter does not bypass network filters or access controls.
