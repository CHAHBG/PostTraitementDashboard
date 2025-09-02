"""
Extract commune names from 'source_file' property for parcel GeoJSON files.
- Looks for files in geojson/parcels/*.normalized.geojson or falls back to geojson/parcels/*.geojson
- For each feature: if 'commune' is missing or null and 'source_file' is present, extract substring before first '_' and normalize it
- Writes output with suffix `.source_commune.geojson`
- Produces report at data/commune_extraction_report.json

Usage:
    python scripts/extract_commune_from_sourcefile.py
"""
import os
import json
import re
import unicodedata
from glob import glob

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PARCELS_DIR = os.path.join(ROOT, 'geojson', 'parcels')
REPORT_PATH = os.path.join(ROOT, 'data', 'commune_extraction_report.json')


def normalize_name(v):
    if v is None:
        return None
    if not isinstance(v, str):
        v = str(v)
    v = v.strip()
    if not v:
        return None
    v = unicodedata.normalize('NFD', v)
    v = ''.join(ch for ch in v if unicodedata.category(ch) != 'Mn')
    v = re.sub(r"\s+", ' ', v)
    v = v.upper()
    return v


def extract_from_source_file(sf):
    if not sf or not isinstance(sf, str):
        return None
    # often values like 'TOMBORONKOTO_LINESTRINGZ' or 'SINTHIOU_MALEME_LINESTRINGZ'
    # Strategy: try to match known commune names from the project's communes list
    s = os.path.splitext(os.path.basename(sf))[0]
    candidate = s.replace('_', ' ').replace('-', ' ').strip()
    candidate_norm = normalize_name(candidate)

    # load known communes (from data/communes_data.json) once
    global _KNOWN_COMMUNES
    if '_KNOWN_COMMUNES' not in globals():
        _KNOWN_COMMUNES = set()
        try:
            comm_file = os.path.join(ROOT, 'data', 'communes_data.json')
            with open(comm_file, 'r', encoding='utf-8') as cf:
                jd = json.load(cf)
                for c in jd.get('communes', []):
                    n = c.get('name')
                    if not n:
                        continue
                    # normalize known names, also replace underscores/dashes with spaces
                    n_space = n.replace('_', ' ').replace('-', ' ')
                    _KNOWN_COMMUNES.add(normalize_name(n_space))
                    _KNOWN_COMMUNES.add(normalize_name(n))
        except Exception:
            _KNOWN_COMMUNES = set()

    # find best (longest) commune name that appears in candidate_norm
    best = None
    if _KNOWN_COMMUNES:
        for comm in _KNOWN_COMMUNES:
            if comm in candidate_norm:
                if best is None or len(comm) > len(best):
                    best = comm
    if best:
        return best

    # fallback: take first token if no known commune matched
    token = re.split(r'[_\-\s]+', s)[0]
    token = token.strip()
    if not token:
        return None
    return normalize_name(token)


def stream_features_from_geojson(fp):
    with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    m = re.search(r'"features"\s*:\s*\[', data)
    if not m:
        raise ValueError('No features array')
    array_start = m.end()
    i = array_start
    depth = 1
    in_str = False
    esc = False
    while i < len(data):
        ch = data[i]
        if in_str:
            if esc:
                esc = False
            elif ch == '\\':
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    array_end = i
                    break
        i += 1
    pre = data[:array_start]
    features_block = data[array_start:array_end]
    post = data[array_end:]
    n = len(features_block)
    i = 0
    while i < n:
        while i < n and features_block[i].isspace():
            i += 1
        if i < n and features_block[i] == ',':
            i += 1
            continue
        if i >= n:
            break
        if features_block[i] != '{':
            i += 1
            continue
        depth = 0
        start_idx = i
        in_str = False
        esc = False
        while i < n:
            ch = features_block[i]
            if in_str:
                if esc:
                    esc = False
                elif ch == '\\':
                    esc = True
                elif ch == '"':
                    in_str = False
            else:
                if ch == '"':
                    in_str = True
                elif ch == '{':
                    depth += 1
                elif ch == '}':
                    depth -= 1
                    if depth == 0:
                        i += 1
                        break
            i += 1
        feat_text = features_block[start_idx:i]
        yield pre, feat_text, post
        pre = ''


def process_file(in_path, out_path, report):
    pre_written = False
    first = True
    total = 0
    updated = 0
    samples = []
    gen = stream_features_from_geojson(in_path)
    with open(out_path, 'w', encoding='utf-8') as out_f:
        for pre, feat_text, post in gen:
            if not pre_written:
                out_f.write(pre)
                pre_written = True
            feat = json.loads(feat_text)
            props = feat.get('properties', {}) or {}
            commune = props.get('commune')
            if not commune and 'source_file' in props:
                sf = props.get('source_file')
                extracted = extract_from_source_file(sf)
                if extracted:
                    props['commune'] = extracted
                    updated += 1
                    if len(samples) < 5:
                        samples.append({'source_file': sf, 'commune': extracted})
            feat['properties'] = props
            if first:
                out_f.write('\n')
                out_f.write(json.dumps(feat, ensure_ascii=False))
                first = False
            else:
                out_f.write(',\n')
                out_f.write(json.dumps(feat, ensure_ascii=False))
            total += 1
        out_f.write('\n')
        out_f.write(']')
        if post:
            out_f.write(post[1:])
    report['files'].append({'input': in_path, 'output': out_path, 'total_features': total, 'updated': updated, 'samples': samples})


def main():
    report = {'files': []}
    patterns = [os.path.join(PARCELS_DIR, '*.normalized.geojson'), os.path.join(PARCELS_DIR, '*.geojson')]
    seen = set()
    for pat in patterns:
        for f in glob(pat):
            if f in seen:
                continue
            seen.add(f)
            if f.endswith('.source_commune.geojson'):
                continue
            base = os.path.splitext(f)[0]
            out = base + '.source_commune.geojson'
            print('Processing', os.path.relpath(f, ROOT), '->', os.path.relpath(out, ROOT))
            try:
                process_file(f, out, report)
            except Exception as e:
                report['files'].append({'input': f, 'error': str(e)})
    with open(REPORT_PATH, 'w', encoding='utf-8') as rf:
        json.dump(report, rf, ensure_ascii=False, indent=2)
    print('Done. Report:', REPORT_PATH)

if __name__ == '__main__':
    main()
