# Push changes to GitHub (Pranshu115/vizon)

## 1. Install Git first (required)

**"git is not recognized"** means Git is not installed or not on your PATH.

### Option A: Install Git for Windows (recommended)

1. **Download:** https://git-scm.com/download/win  
   (or 64-bit direct: https://github.com/git-for-windows/git/releases/latest — get `Git-*-64-bit.exe`)

2. **Run the installer.** On the "Adjusting your PATH" step, choose:
   - **"Git from the command line and also from 3rd-party software"**  
   so `git` works in PowerShell and CMD.

3. **Finish** the installer, then **close and reopen** PowerShell (or Cursor terminal).  
   In a **new** PowerShell window run:
   ```powershell
   git --version
   ```
   If you see a version number (e.g. `git version 2.43.0`), Git is ready.

### Option B: Git might be installed but not in PATH

If you already installed Git, try in PowerShell:

```powershell
& "C:\Program Files\Git\bin\git.exe" --version
```

If that works, add Git to PATH for this session:

```powershell
$env:Path += ";C:\Program Files\Git\bin"
git --version
```

To add permanently: Windows Settings → System → About → Advanced system settings → Environment Variables → under "Path" add `C:\Program Files\Git\bin`.

## 2. If Cursor/IDE terminal says "git is not recognized"

Git is installed but that terminal was started before Git was. Either:

- **Use a new PowerShell window** (Windows menu → PowerShell) and run the commands below from there, **or**
- In Cursor’s terminal, run this **once** at the top of the session so `git` is found:
  ```powershell
  $env:Path += ";C:\Program Files\Git\bin"
  ```

## 3. If you see "Unable to create index.lock" or "File exists"

Something (often Cursor/IDE or a previous git run) is holding the repo. **Easiest fix: start with a clean repo.**

1. **Close Cursor (and any VS Code) completely** so nothing is using the folder.
2. Open **PowerShell** (Windows → PowerShell) and run **one** of these:

**Option A – Run the script (recommended)**  
In PowerShell:
```powershell
cd "C:\Users\Administrator\Downloads\vizon-main\vizon-main"
powershell -ExecutionPolicy Bypass -File push-clean.ps1
```
The script removes `.git`, re-initializes, adds all files, commits, and pushes.

**Option B – Manual clean**  
In PowerShell:
```powershell
$env:Path += ";C:\Program Files\Git\bin"
cd "C:\Users\Administrator\Downloads\vizon-main\vizon-main"
Remove-Item -Recurse -Force .git
git init
git remote add origin https://github.com/Pranshu115/vizon.git
git branch -M main
git add -A
git commit -m "Updates: Eicher 2059XP single listing, console fix, memory/watch fixes, seed scripts"
git push -u origin main
```
If push says the remote has content and rejects, run: `git push -u origin main --force`

## 4. Push from project folder

Open **PowerShell** in this project folder (`vizon-main`), then run:

```powershell
# Optional: if this terminal doesn't find git, run once:
$env:Path += ";C:\Program Files\Git\bin"

cd "C:\Users\Administrator\Downloads\vizon-main\vizon-main"

# If you get "index.lock" error, run this first then try again:
# Remove-Item -Force .git\index.lock -ErrorAction SilentlyContinue

# If this folder is not yet a git repo (no .git folder), run:
# git init
# git remote add origin https://github.com/Pranshu115/vizon.git
# git branch -M main

git add -A
git status
git commit -m "Updates: Eicher 2059XP single listing, console fix, memory/watch fixes, seed scripts"
git branch -M main
git push -u origin main
```

If the folder **is already** a git repo and `origin` is set, you only need:

```powershell
cd "C:\Users\Administrator\Downloads\vizon-main\vizon-main"
git add -A
git commit -m "Updates: Eicher 2059XP single listing, console fix, memory/watch fixes, seed scripts"
git push -u origin main
```

## 3. If push asks for login

- GitHub no longer accepts account passwords for `git push`.
- Use either:
  - **Personal Access Token (HTTPS):**  
    GitHub → Settings → Developer settings → Personal access tokens → Generate new token.  
    When `git push` asks for password, paste the token.
  - **SSH:**  
    Add your SSH key to GitHub and use the SSH remote:  
    `git remote set-url origin git@github.com:Pranshu115/vizon.git`  
    then `git push -u origin main`.

## Summary of changes included

- Eicher 2059 XP: only one listing (72,154 km); removed 3 duplicates from seed data and Supabase script.
- Truck gallery: Tata 609g fallback message reduced to one `console.warn`.
- Next.js: large image folders ignored in watch; `dev:memory` script added for allocation issues.
- New scripts: `remove-extra-eicher-2059xp.js`, updated `seed-eicher-2059xp-supabase.js`, `seed-all-30-trucks.js` (27 trucks, one Eicher 2059 XP).
- README: Supabase truck seeding steps and `seed:eicher-2059xp` / `remove-extra-eicher-2059xp` documented.

After a successful push, trigger a new deploy on Vercel/Render (or your platform); it will use the latest code from https://github.com/Pranshu115/vizon.
