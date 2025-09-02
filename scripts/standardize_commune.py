"""
Standardize commune names across JSON and GeoJSON files.
- Detects candidate commune fields (CCRCA, CCRCA_1, CAV, name, Nom, etc.)
- Normalizes names (uppercase, remove accents, trim)
- For GeoJSON FeatureCollections streams features to avoid high memory usage and writes a normalized output file with suffix `.normalized.geojson`
- For other JSON files, attempts to normalize object arrays in-place and writes `.normalized.json`
- Produces a report at `data/commune_standardization_report.json`

Usage:
    python scripts/standardize_commune.py

"""
import json
import os
import re
import unicodedata
from glob import glob
from collections import Counter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATA_DIR = os.path.join(ROOT, 'data')
GEOJSON_DIR = os.path.join(ROOT, 'geojson')
REPORT_PATH = os.path.join(DATA_DIR, 'commune_standardization_report.json')

# Candidate keys in order of preference
CANDIDATES = ['commune', 'CCRCA', 'CCRCA_1', 'CAV', 'COMMUNE', 'COMM_NAME', 'name', 'Nom', 'commune_name', 'SUSCOL']


def normalize_name(v):
    if v is None:
        return None
    if not isinstance(v, str):
        v = str(v)
    v = v.strip()
    if not v:
        return None
    # normalize accents
    v = unicodedata.normalize('NFD', v)
    v = ''.join(ch for ch in v if unicodedata.category(ch) != 'Mn')
    v = re.sub(r"\s+", ' ', v)
    v = v.upper()
    return v


def detect_geojson(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        head = f.read(4096)
        return '"features"' in head


def stream_features_from_geojson(fp):
    """Yield (pre_header, feature_json_str, post_footer) where pre_header is text before features array
    and post_footer is text after the features array (closing braces). For streaming we yield features one by one.
    """
    with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
        data = f.read()
    # quick fallback: find "features" and the start of '[' then parse
    m = re.search(r'"features"\s*:\s*\[', data)
    if not m:
        raise ValueError('No features array found')
    start = m.start()
    array_start = m.end()  # position after the '['
    # find the matching closing bracket for the features array by scanning braces
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
    else:
        raise ValueError('Malformed GeoJSON: features array not closed')

    pre = data[:array_start]
    features_block = data[array_start:array_end]
    post = data[array_end:]

    # Now split features_block into individual JSON objects using a simple scanner
    feats = []
    i = 0
    n = len(features_block)
    while i < n:
        # skip whitespace and commas
        while i < n and features_block[i].isspace():
            i += 1
        if i < n and features_block[i] == ',':
            i += 1
            continue
        if i >= n:
            break
        if features_block[i] != '{':
            # unexpected
            i += 1
            continue
        # capture balanced braces
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


def find_commune_in_properties(props):
    for k in CANDIDATES:
        if k in props and props[k] not in (None, ''):
            return k, props[k]
    # fallback: try any key that looks like a name (heuristic)
    for k, v in props.items():
        if isinstance(v, str) and len(v) < 100 and re.match(r'^[A-Za-zÀ-ÖØ-öø-ÿ \-\_]+$', v):
            return k, v
    return None, None


def process_geojson(in_path, out_path, report):
    try:
        # stream features and write new file
        pre_written = False
        first_feature = True
        total = 0
        found_counter = Counter()
        samples = {}

        gen = stream_features_from_geojson(in_path)
        with open(out_path, 'w', encoding='utf-8') as out_f:
            for pre, feat_text, post in gen:
                if not pre_written:
                    # write header up to features array's opening '['
                    out_f.write(pre)
                    out_f.write('\n')
                    pre_written = True
                    out_f.write('')
                    out_f.write('')
                # parse feature
                try:
                    feat = json.loads(feat_text)
                except Exception:
                    # try to be lenient by fixing trailing commas, etc.
                    feat = json.loads(feat_text)
                props = feat.get('properties', {})
                key, val = find_commune_in_properties(props)
                if key:
                    norm = normalize_name(val)
                    if norm:
                        props['commune'] = norm
                        found_counter[key] += 1
                        if key not in samples:
                            samples[key] = norm
                else:
                    props['commune'] = None
                feat['properties'] = props
                # write feature with commas
                if first_feature:
                    out_f.write('\n')
                    out_f.write(json.dumps(feat, ensure_ascii=False))
                    first_feature = False
                else:
                    out_f.write(',\n')
                    out_f.write(json.dumps(feat, ensure_ascii=False))
                total += 1
            # close array and write the closing part from post (which contains closing brackets and possible other fields)
            out_f.write('\n')
            out_f.write(']')
            # post starts with ']' as found earlier; write rest after it
            # find the rest after the first ']'
            if post:
                # post begins with ']' at 0, so write post[1:]
                out_f.write(post[1:])

        report['files'].append({
            'input': in_path,
            'output': out_path,
            'total_features': total,
            'found_keys': dict(found_counter),
            'samples': samples
        })
    except Exception as e:
        report['errors'].append({'file': in_path, 'error': str(e)})


def process_json_file(in_path, out_path, report):
    try:
        with open(in_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        total = 0
        found_counter = Counter()
        samples = {}

        # Find arrays of objects inside data
        modified = False
        def normalize_obj(obj):
            nonlocal total, modified
            if not isinstance(obj, dict):
                return
            key, val = find_commune_in_properties(obj)
            if key:
                norm = normalize_name(val)
                if norm:
                    obj['commune'] = norm
                    found_counter[key] += 1
                    if key not in samples:
                        samples[key] = norm
                    modified = True
            total += 1

        if isinstance(data, list):
            for obj in data:
                normalize_obj(obj)
        elif isinstance(data, dict):
            # normalize top-level known arrays
            for k, v in data.items():
                if isinstance(v, list):
                    for obj in v:
                        normalize_obj(obj)
        # write output
        with open(out_path, 'w', encoding='utf-8') as out_f:
            json.dump(data, out_f, ensure_ascii=False, indent=2)
        report['files'].append({
            'input': in_path,
            'output': out_path,
            'total_processed': total,
            'found_keys': dict(found_counter),
            'samples': samples
        })
    except Exception as e:
        report['errors'].append({'file': in_path, 'error': str(e)})


def main():
    report = {'files': [], 'errors': []}

    # Gather files: data/*.json and geojson/**/*.geojson
    data_files = glob(os.path.join(DATA_DIR, '*.json'))
    geojson_files = glob(os.path.join(GEOJSON_DIR, '**', '*.geojson'), recursive=True)

    all_files = data_files + geojson_files

    for fpath in all_files:
        rel = os.path.relpath(fpath, ROOT)
        print('Processing', rel)
        base, ext = os.path.splitext(fpath)
        if ext.lower() == '.geojson':
            out = base + '.normalized.geojson'
            process_geojson(fpath, out, report)
        else:
            out = base + '.normalized.json'
            process_json_file(fpath, out, report)

    # write report
    with open(REPORT_PATH, 'w', encoding='utf-8') as rf:
        json.dump(report, rf, ensure_ascii=False, indent=2)

    print('\nDone. Report written to', REPORT_PATH)


if __name__ == '__main__':
    main()
