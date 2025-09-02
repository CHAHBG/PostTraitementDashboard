// TypeScript reference: builds lookup maps for dashboard data loading
// Usage (TS): tsc scripts/data_loader.ts && node scripts/data_loader.js

import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '..')
const PARCELS_DIR = path.join(ROOT, 'geojson', 'parcels')
const OUT_DIR = path.join(ROOT, 'data', 'lookups')

const preferPatterns = [
  '*.source_commune.geojson',
  '*.normalized.source_commune.geojson',
  '*.normalized.geojson',
  '*.geojson'
]

function findParcelFiles(): string[] {
  const glob = require('glob')
  const found: string[] = []
  for (const pat of preferPatterns) {
    const matches = glob.sync(path.join(PARCELS_DIR, pat))
    for (const m of matches) {
      if (!found.includes(m)) found.push(m)
    }
  }
  return found
}

function normalizeName(v: any): string | null {
  if (!v) return null
  return String(v).trim().toUpperCase()
}

function findNumParcel(props: any): string | null {
  const keys = ['Num_parcel','NUM_PARCEL','num_parcel','numParcel','num','ID','id','Id_parcel','IDPARCEL']
  for (const k of keys) {
    if (props[k]) return String(props[k])
  }
  return null
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
  const files = findParcelFiles()
  console.log('Parcel files used:', files)

  const numParcelMap: Record<string, any> = {}
  const communeMap: Record<string, {count:number, parcels:string[]}> = {}

  for (const f of files) {
    console.log('Reading', f)
    const raw = fs.readFileSync(f, 'utf8')
    let gj: any
    try { gj = JSON.parse(raw) } catch(e) { console.error('Invalid JSON', f); continue }
    const features = gj.features || []
    for (const feat of features) {
      const props = feat.properties || {}
      const num = findNumParcel(props)
      const commune = normalizeName(props['commune'] || props['CCRCA'] || props['CCRCA_1'] || props['CAV'] || props['Nom'] || props['name'])
      if (num) {
        if (!numParcelMap[num]) {
          numParcelMap[num] = {
            commune: commune || null,
            properties: props
          }
        } else {
          // merge missing commune or properties
          if (!numParcelMap[num].commune && commune) numParcelMap[num].commune = commune
        }
        if (commune) {
          if (!communeMap[commune]) communeMap[commune] = {count:0, parcels:[]}
          communeMap[commune].count += 1
          if (communeMap[commune].parcels.length < 1000) communeMap[commune].parcels.push(num)
        }
      }
    }
  }

  const numOut = path.join(OUT_DIR, 'num_parcel_lookup.json')
  const commOut = path.join(OUT_DIR, 'commune_lookup.json')
  fs.writeFileSync(numOut, JSON.stringify(numParcelMap, null, 2), 'utf8')
  fs.writeFileSync(commOut, JSON.stringify(communeMap, null, 2), 'utf8')
  console.log('Wrote', numOut, commOut)
}

if (require.main === module) main()
