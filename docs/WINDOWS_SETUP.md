# Development on Windows

This project works on **Windows**, **macOS**, and **Linux**. Use this guide when working on Windows.

## Prerequisites

1. **Node.js** (LTS, e.g. 18 or 20)  
   - Download: https://nodejs.org/  
   - Ensure **"Add to PATH"** is checked during install.

2. **Git for Windows**  
   - Download: https://git-scm.com/download/win  
   - During install, choose **"Git from the command line and also from 3rd-party software"** so `git` works in PowerShell and CMD.

3. **npm**  
   - Comes with Node.js. Check with: `npm -v`

## If the terminal says "git is not recognized" or "node is not recognized"

- Close **all** terminals and Cursor/VS Code, then reopen.  
- Or in PowerShell, add to PATH for the current session:
  ```powershell
  $env:Path += ";C:\Program Files\Git\bin"
  $env:Path += ";C:\Program Files\nodejs"
  ```

## Setup steps (Windows)

### 1. Open terminal in project folder

```powershell
cd "C:\Users\Administrator\Downloads\vizon-main\vizon-main"
```

(Use your actual path to the project.)

### 2. Install dependencies

```powershell
npm install
```

### 3. Environment variables

Copy the example env file and edit it, or use the PowerShell setup script:

```powershell
Copy-Item .env.example .env.local
# Then edit .env.local and add your Supabase URL and keys (see .env.example).
```

**Or** run the interactive script (prompts for Supabase URL and anon key):

```powershell
npm run setup:env:win
```
(Or: `powershell -ExecutionPolicy Bypass -File setup-supabase-env.ps1`)

### 4. Run the app

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

## NPM scripts (all work on Windows)

| Command | Description |
|--------|-------------|
| `npm run dev` | Start dev server with file watcher |
| `npm run dev:simple` | Start dev server only (no watcher) |
| `npm run dev:memory` | Dev server with higher Node memory (if you see allocation errors) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run seed:supabase` | Seed all trucks to Supabase (replaces existing) |
| `npm run seed:eicher-2059xp` | Add Eicher 2059 XP truck to Supabase |
| `npm run remove-extra-eicher-2059xp` | Keep only one Eicher 2059 XP (72,154 km), remove others |

## Paths and line endings

- All **Node scripts** in this repo use `path.join(__dirname, ...)` so they work from any working directory on Windows.
- **.gitattributes** is set so line endings are consistent across Mac and Windows (LF in repo; you can use CRLF locally on Windows if needed).

## Shell scripts

- **Mac/Linux:** use `setup-supabase-env.sh` for env setup.
- **Windows:** use `setup-supabase-env.ps1` (PowerShell) for the same env setup.

## Troubleshooting

- **"Array buffer allocation failed"**  
  Run `npm run dev:memory` or exclude large image folders from the watcher (see `next.config.js`).

- **Git "index.lock" errors**  
  Close Cursor and any other app using the repo, then remove the lock and try again:
  ```powershell
  Remove-Item -Force .git\index.lock -ErrorAction SilentlyContinue
  ```
  Or use the clean-push script: see **PUSH_TO_GITHUB.md**.

- **Port 3000 in use**  
  Stop the other process or set a different port:
  ```powershell
  $env:PORT=3001; npm run dev
  ```
