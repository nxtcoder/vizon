#!/usr/bin/env node
/**
 * Records in `trucks` the storage media of each pre-form listing (gallery,
 * videos, legal and inspection report), so the page can read them from the DB
 * instead of resolving a storage folder by truck name at request time.
 *
 *   node scripts/backfill-media-from-storage.js                 # dry run
 *   node scripts/backfill-media-from-storage.js --apply
 *   node scripts/backfill-media-from-storage.js --api http://localhost:3100   # also compare with what the site resolves
 *
 * A truck's files are found by what they are, never by the truck's name (name
 * matching is what put three Bolero listings on one folder):
 *   1. its folder in the Website Listing export — the one holding its web report,
 *      whose file name carries the plate. Every photo, video and report there is
 *      looked up in `truck-images` by original file name (uploads were renamed
 *      `<timestamp>-Copy_of_<name>`), whichever storage folder it landed in.
 *   2. otherwise a storage folder named after the plate (HR_38_W_2162).
 *
 * Only empty columns are filled; nothing already set is overwritten.
 */
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const BUCKET = 'truck-images'
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const apiBase = args.includes('--api') ? args[args.indexOf('--api') + 1] : null
const DIR = args.includes('--dir')
  ? args[args.indexOf('--dir') + 1]
  : path.join(process.env.HOME, 'Personal/repos/axlerator/Website Listing-20260801T185045Z-1-001/Website Listing')

/** "1776705431322-Copy_of_IMG 01.jpg" and "Copy of IMG 01.jpg" -> "img01jpg" */
const fileKey = (n) => n.toLowerCase().replace(/^\d{10,}-/, '').replace(/^copy[ _]of[ _]/, '').replace(/[^a-z0-9]/g, '')

const plateKey = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const isVideo = (n) => /\.(mp4|mov|webm)$/i.test(n)
const isImage = (n) => /\.(jpe?g|png|webp|heic)$/i.test(n)
const empty = (v) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
  const url = (p) => supabase.storage.from(BUCKET).getPublicUrl(p).data.publicUrl
  const list = async (prefix) => (await supabase.storage.from(BUCKET).list(prefix, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })).data || []

  // every stored file, by original name
  const folders = (await list('')).filter((f) => !f.id).map((f) => f.name)
  const stored = {}
  for (const folder of folders) {
    for (const sub of [folder, `${folder}/REPORTS`]) {
      for (const f of (await list(sub)).filter((x) => x.id)) (stored[fileKey(f.name)] ||= []).push(`${sub}/${f.name}`)
    }
  }
  // plate -> its folder in the Website Listing export
  const localByPlate = {}
  for (const d of fs.existsSync(DIR) ? fs.readdirSync(DIR) : []) {
    for (const f of fs.readdirSync(path.join(DIR, d))) {
      if (/web\s*report/i.test(f)) localByPlate[plateKey(f.replace(/\.pdf$/i, '').replace(/web\s*report/i, ''))] = path.join(DIR, d)
    }
  }

  const { data: trucks, error } = await supabase
    .from('trucks')
    .select('id, name, registration_number, image_url, gallery, videos, web_report_url, inspection_report_url, legal_report_url')
    .is('inspection_id', null)
    .eq('certified', true)
    .order('id')
  if (error) throw error

  console.log(`${apply ? 'APPLY' : 'DRY RUN'} — ${trucks.length} certified pre-form trucks, ${folders.length} storage folders\n`)
  let written = 0
  for (const t of trucks) {
    const plate = plateKey(t.registration_number)
    const line = `#${t.id} ${t.name} (${t.registration_number || 'no plate'})`
    const local = localByPlate[plate]
    let paths = []      // storage paths of this truck's files
    let source
    const unmatched = []
    if (local) {
      source = `export folder "${path.basename(local)}"`
      const hits = []
      for (const f of fs.readdirSync(local)) {
        if (/web\s*report/i.test(f)) continue
        const hit = stored[fileKey(f)]
        if (hit) hits.push([f, hit])
        else unmatched.push(f)
      }
      // A generic name ("Copy of Legal Report.pdf") can exist for several trucks:
      // take the copy in the folder most of this truck's files landed in.
      const votes = {}
      for (const [, hit] of hits) for (const folder of new Set(hit.map((p) => p.split('/')[0]))) votes[folder] = (votes[folder] || 0) + 1
      const home = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0]
      for (const [f, hit] of hits) {
        const mine = hit.find((p) => p.split('/')[0] === home)
        if (mine) paths.push(mine)
        else if (hit.length === 1) paths.push(hit[0])
        else console.log(`  AMBIGUOUS ${f}: stored in ${hit.map((p) => p.split('/')[0]).join(', ')}; left out`)
      }
    } else if (folders.some((f) => plateKey(f) === plate)) {
      const folder = folders.find((f) => plateKey(f) === plate)
      source = `storage folder "${folder}"`
      paths = Object.values(stored).flat().filter((p) => p.split('/')[0] === folder)
    } else {
      console.log(`${line}\n  SKIP      no export folder or storage folder carries this plate`)
      continue
    }
    const inFolders = [...new Set(paths.map((p) => p.split('/')[0]))]
    console.log(`${line} <- ${source}; stored in ${inFolders.join(', ') || 'nothing'}`)
    if (unmatched.length) console.log(`  not in storage: ${unmatched.join(', ')}`)

    if (apiBase) {
      const qs = new URLSearchParams({ truckName: t.name })
      if (t.registration_number) qs.set('registrationNumber', t.registration_number)
      if (t.image_url) qs.set('imageUrl', t.image_url)
      const body = await (await fetch(`${apiBase}/api/truck-images?${qs}`)).json().catch(() => ({}))
      if (body.folder && !inFolders.includes(body.folder)) console.log(`  SITE BUG  the site shows folder "${body.folder}" for this truck today`)
    }

    const names = (re) => paths.filter((p) => re.test(p.split('/').pop().replace(/_/g, ' ')))
    const pdf = (re) => { const p = names(re).find((x) => /\.pdf$/i.test(x)); return p ? url(p) : null }
    const found = {
      gallery: paths.filter((p) => isImage(p)).sort().map(url),
      videos: paths.filter((p) => isVideo(p)).sort().map(url),
      legal_report_url: pdf(/legal\s*report/i),
      inspection_report_url: pdf(/inspection/i),
    }
    const set = {}
    for (const [col, val] of Object.entries(found)) {
      if (empty(val)) { console.log(`  missing   ${col}`); continue }
      if (!empty(t[col])) continue
      set[col] = val
      console.log(`  fill      ${col} = ${Array.isArray(val) ? `${val.length} file(s)` : decodeURIComponent(val.split('/').pop())}`)
    }
    if (apply && Object.keys(set).length) {
      const { error: e } = await supabase.from('trucks').update(set).eq('id', t.id)
      if (e) console.log(`  ERROR     ${e.message}`)
      else written++
    }
  }
  if (apply) console.log(`\n${written} rows written`)
}

main().catch((e) => { console.error(e); process.exit(1) })
