# 📝 How to Set Up Your .env.local File

## What You Need

You need **TWO values** from your Supabase dashboard:

1. **Project URL** - Looks like: `https://xxxxxxxxxxxxx.supabase.co`
2. **Anon Key** - A long string starting with `eyJ...`

---

## Step-by-Step Instructions

### Step 1: Get Your Supabase Credentials

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project (if you have multiple)
3. Click **"Settings"** (⚙️ icon at the bottom left)
4. Click **"API"** (under Project Settings)
5. You'll see two important values:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQxMjM0NTY3LCJleHAiOjE5NTY4MTA1Njd9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Step 2: Create .env.local File

**Option A: Using Terminal/Command Line**
```bash
# Navigate to your project folder
cd /Users/sahinbegum/Downloads/Axxlerator-main

# Create the file
touch .env.local

# Open it in your editor
open .env.local
# OR
nano .env.local
```

**Option B: Using VS Code or Any Text Editor**
1. Open your project in VS Code (or any text editor)
2. Create a new file in the root folder
3. Name it exactly: `.env.local` (with the dot at the beginning)

### Step 3: Add Your Credentials

Copy this template and **replace** the placeholder values with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example with real values:**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTIzNDU2NywiZXhwIjoxOTU2ODEwNTY3fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Save the File

- **VS Code**: Press `Cmd+S` (Mac) or `Ctrl+S` (Windows/Linux)
- **Nano**: Press `Ctrl+X`, then `Y`, then `Enter`
- **Other editors**: Save normally

---

## ✅ Complete Example

Here's what a complete `.env.local` file should look like:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTIzNDU2NywiZXhwIjoxOTU2ODEwNTY3fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**That's it! Just these 2 lines!** 🎉

---

## 🔍 How to Verify It's Working

After creating your `.env.local` file:

1. **Restart your development server** (if it's running):
   ```bash
   # Stop the server (Ctrl+C)
   # Then start it again
   npm run dev
   ```

2. **Check the console** - You should NOT see the warning:
   ```
   ⚠️  Supabase credentials not found...
   ```

3. **Test your website** - Try accessing your API endpoints

---

## ⚠️ Important Notes

1. **File name must be exactly**: `.env.local` (with the dot!)
2. **Location**: Must be in the **root** of your project (same folder as `package.json`)
3. **Never commit this file** - It's already in `.gitignore` to keep your credentials safe
4. **No spaces** around the `=` sign
5. **No quotes needed** around the values (but they won't hurt if you add them)

---

## 🆘 Troubleshooting

**Problem: "Supabase credentials not found" warning**
- ✅ Check the file is named `.env.local` (not `.env` or `env.local`)
- ✅ Check it's in the project root folder
- ✅ Check there are no typos in variable names
- ✅ Restart your development server

**Problem: "Invalid API key" error**
- ✅ Double-check you copied the entire anon key (it's very long!)
- ✅ Make sure there are no extra spaces
- ✅ Verify you're using the "anon public" key, not the "service_role" key

**Problem: "Connection refused" error**
- ✅ Check your Project URL is correct
- ✅ Make sure your Supabase project is active (not paused)

---

## 📸 Visual Guide

### Where to find the values in Supabase:

```
Supabase Dashboard
└── Settings ⚙️
    └── API
        ├── Project URL: https://xxxxx.supabase.co
        └── anon public: eyJhbGciOiJIUzI1NiIs...
```

### What your .env.local file should look like:

```
📁 Axxlerator-main/
├── 📄 package.json
├── 📄 .env.local          ← Create this file here
│   └── NEXT_PUBLIC_SUPABASE_URL=...
│   └── NEXT_PUBLIC_SUPABASE_ANON_KEY=...
└── 📁 app/
```

---

## 💡 Quick Copy-Paste Template

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Just fill in the values after the `=` sign!

---

**Need help?** Just tell me your Project URL and anon key, and I can create the file for you! 😊

