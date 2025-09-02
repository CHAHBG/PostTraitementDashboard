import json
from collections import Counter

COMMUNES_JSON = r"c:\Users\USER\Documents\Applications\NewEDL\data\communes_data.json"
COMMUNES_GEOJSON = r"c:\Users\USER\Documents\Applications\NewEDL\geojson\communes\communes.geojson"

with open(COMMUNES_JSON, 'r', encoding='utf-8') as f:
    data = json.load(f)
    names = [c.get('name') for c in data.get('communes', []) if c.get('name')]
    set_names = set(names)

with open(COMMUNES_GEOJSON, 'r', encoding='utf-8') as f:
    gj = json.load(f)

candidates = ['CAV', 'CCRCA', 'CCRCA_1', 'SUSCOL', 'REG', 'DEPT', 'CodeJoin']
values = {k: Counter() for k in candidates}

for feat in gj.get('features', []):
    props = feat.get('properties', {})
    for k in candidates:
        v = props.get(k)
        if v is None:
            continue
        # normalize
        if isinstance(v, (int, float)):
            v = str(v)
        v = v.strip() if isinstance(v, str) else str(v)
        values[k][v] += 1

# compute overlaps
print('Total communes.json names:', len(set_names))
print('Sample names from communes.json:', list(names)[:10])
print('\nCandidate field statistics and overlap with communes.json:')
for k, counter in values.items():
    distinct = set(counter.keys())
    intersection = distinct & set_names
    match_count = len(intersection)
    total_distinct = len(distinct)
    pct = (match_count / len(set_names) * 100) if set_names else 0
    print(f"\nField: {k}")
    print(f"  Distinct values: {total_distinct}")
    print(f"  Matches with communes.json: {match_count} ({pct:.1f}% of communes.json names)")
    if match_count:
        print(f"  Matched examples: {list(intersection)[:10]}")
    else:
        # show top values
        print(f"  Top values: {counter.most_common(5)}")

# recommend best field
best = None
best_pct = -1
for k, counter in values.items():
    distinct = set(counter.keys())
    match_count = len(distinct & set_names)
    pct = (match_count / len(set_names) * 100) if set_names else 0
    if pct > best_pct:
        best_pct = pct
        best = k

print(f"\nRecommended primary commune field: {best} ({best_pct:.1f}% match)")
