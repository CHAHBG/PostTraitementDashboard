const fs = require('fs')
const path = require('path')
const glob = require('glob')

const ROOT = path.resolve(__dirname, '..')
const PARCELS_DIR = path.join(ROOT, 'geojson', 'parcels')
const OUT_DIR = path.join(ROOT, 'data', 'lookups')

const preferPatterns = [
  'collective_parcels.source_commune.geojson',
  'individual_parcels.source_commune.geojson',
  'unjoined_parcels.source_commune.geojson',
  'collective_parcels.normalized.source_commune.geojson',
  'individual_parcels.normalized.source_commune.geojson',
  'unjoined_parcels.normalized.source_commune.geojson',
  'collective_parcels.normalized.geojson',
  'individual_parcels.normalized.geojson',
  'unjoined_parcels.normalized.geojson',
  'collective_parcels.geojson',
  'individual_parcels.geojson',
  'unjoined_parcels.geojson'
]

function findParcelFiles() {
  const found = []
  for (const pat of preferPatterns) {
    const matches = glob.sync(path.join(PARCELS_DIR, pat))
    for (const m of matches) if (!found.includes(m)) found.push(m)
  }
  return found
}

function normalizeName(v) {
  if (!v) return null
  return String(v).trim().toUpperCase()
}

function findNumParcel(props) {
  const keys = ['Num_parcel','NUM_PARCEL','num_parcel','numParcel','num','ID','id','Id_parcel','IDPARCEL']
  for (const k of keys) if (props[k]) return String(props[k])
  return null
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
  const files = findParcelFiles()
  console.log('Parcel files used:', files)

  const numParcelMap = {}
  const communeMap = {}

  for (const f of files) {
    console.log('Reading', f)
    const raw = fs.readFileSync(f, 'utf8')
    let gj
    try { gj = JSON.parse(raw) } catch(e) { console.error('Invalid JSON', f); continue }
    const features = gj.features || []
    for (const feat of features) {
      const props = feat.properties || {}
      const num = findNumParcel(props)
      const commune = normalizeName(props['commune'] || props['CCRCA'] || props['CCRCA_1'] || props['CAV'] || props['Nom'] || props['name'])
      if (num) {
        if (!numParcelMap[num]) {
          numParcelMap[num] = { commune: commune || null, properties: props }
        } else {
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
