const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = path.resolve(__dirname, '..');
const PARCELS_DIR = path.join(ROOT, 'geojson', 'parcels');
const OUT_DIR = path.join(ROOT, 'data', 'lookups');

// Official list of communes
const OFFICIAL_COMMUNES = [
  'BALLOU',
  'GABOU', 
  'MOUDERY',
  'BALA',
  'KOAR',
  'SINTHIOU MALEME',
  'NDOGA BABACAR',
  'NETTEBOULOU',
  'MISSIRAH',
  'BANDAFASSI',
  'DINDEFELO',
  'TOMBORONKOTO',
  'DIMBOLI',
  'FONGOLIMBI',
  'MEDINA BAFFE',
  'BEMBOU',
  'SABODALA'
];

// Mapping for alternate spellings to official names
const COMMUNE_SPELLING_VARIANTS = {
  'DINDEFELLO': 'DINDEFELO',
  'FONGOLEMBI': 'FONGOLIMBI'
};

const preferPatterns = [
  'individual_parcels.normalized.source_commune.geojson',
  'individual_parcels.source_commune.geojson',
  'collective_parcels.normalized.source_commune.geojson',
  'collective_parcels.source_commune.geojson',
  'unjoined_parcels.normalized.source_commune.geojson',
  'unjoined_parcels.source_commune.geojson',
  'individual_parcels.normalized.geojson',
  'collective_parcels.normalized.geojson',
  'unjoined_parcels.normalized.geojson',
  'individual_parcels.geojson',
  'collective_parcels.geojson',
  'unjoined_parcels.geojson'
];

function findParcelFiles() {
  const found = [];
  for (const pat of preferPatterns) {
    const matches = glob.sync(path.join(PARCELS_DIR, pat));
    for (const m of matches) if (!found.includes(m)) found.push(m);
  }
  return found;
}

function normalizeName(v) {
  if (!v) return null;
  const normalized = String(v).trim().toUpperCase();
  
  // Check for alternate spellings
  if (COMMUNE_SPELLING_VARIANTS[normalized]) {
    return COMMUNE_SPELLING_VARIANTS[normalized];
  }
  
  return normalized;
}

function findNumParcel(props) {
  const keys = ['Num_parcel','NUM_PARCEL','num_parcel','numParcel','num','ID','id','Id_parcel','IDPARCEL'];
  for (const k of keys) if (props[k]) return String(props[k]);
  return null;
}

function extractCommuneFromSourceFile(sourceFile) {
  if (!sourceFile) return null;
  
  const normalized = String(sourceFile).toUpperCase();
  
  // Try exact matches first
  for (const commune of OFFICIAL_COMMUNES) {
    if (normalized.includes(commune)) {
      return commune;
    }
  }
  
  // Try with underscore replacements (for multi-word communes)
  for (const commune of OFFICIAL_COMMUNES) {
    const underscoreVersion = commune.replace(/ /g, '_');
    if (normalized.includes(underscoreVersion)) {
      return commune;
    }
  }
  
  return null;
}

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = findParcelFiles();
  console.log('Parcel files used:', files);

  const numParcelMap = {};
  const communeMap = {};
  
  // Initialize communeMap with all official communes
  for (const commune of OFFICIAL_COMMUNES) {
    communeMap[commune] = { count: 0, parcels: [] };
  }

  for (const f of files) {
    console.log('Reading', f);
    const raw = fs.readFileSync(f, 'utf8');
    let gj;
    try { 
      gj = JSON.parse(raw);
    } catch(e) { 
      console.error('Invalid JSON', f); 
      continue;
    }
    
    const features = gj.features || [];
    console.log(`Processing ${features.length} features from ${f}`);
    
    let dindefeloCount = 0;
    let fongolimbiCount = 0;
    
    for (const feat of features) {
      const props = feat.properties || {};
      const num = findNumParcel(props);
      
      // Try multiple sources for commune name
      let commune = normalizeName(
        props['commune'] || 
        props['CCRCA'] || 
        props['CCRCA_1'] || 
        props['CAV'] || 
        props['Nom'] || 
        props['name']
      );
      
      // If commune not found in properties, try to extract from source_file
      if (!commune && props['source_file']) {
        commune = extractCommuneFromSourceFile(props['source_file']);
      }
      
      // Debug specific communes
      if (commune === 'DINDEFELO') dindefeloCount++;
      if (commune === 'FONGOLIMBI') fongolimbiCount++;
      
      if (num) {
        if (!numParcelMap[num]) {
          numParcelMap[num] = { commune: commune || null, properties: props };
        } else {
          if (!numParcelMap[num].commune && commune) numParcelMap[num].commune = commune;
        }
        
        if (commune && communeMap[commune]) {
          communeMap[commune].count += 1;
          if (communeMap[commune].parcels.length < 1000) communeMap[commune].parcels.push(num);
        }
      }
    }
    
    console.log(`Found in ${f}: DINDEFELO: ${dindefeloCount}, FONGOLIMBI: ${fongolimbiCount}`);
  }
  
  // Output debug information
  console.log('\nCommune Statistics:');
  for (const commune of OFFICIAL_COMMUNES) {
    console.log(`${commune}: ${communeMap[commune].count} parcels`);
  }

  const numOut = path.join(OUT_DIR, 'num_parcel_lookup.json');
  const commOut = path.join(OUT_DIR, 'commune_lookup.json');
  fs.writeFileSync(numOut, JSON.stringify(numParcelMap, null, 2), 'utf8');
  fs.writeFileSync(commOut, JSON.stringify(communeMap, null, 2), 'utf8');
  console.log('Wrote', numOut, commOut);
}

if (require.main === module) main();
