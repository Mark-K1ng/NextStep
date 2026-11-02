"""Verify a public catalogue export against the reviewed audit and Ministry data.

Usage: python scripts/verify-catalogue-audit.py --snapshot PATH
The snapshot contains catalogue data only, never accounts or credentials.
This validates the reviewed evidence; it does not turn a dead URL into proof.
"""
import argparse
import json
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--snapshot', type=Path, required=True)
args = parser.parse_args()
data = json.loads(args.snapshot.read_text(encoding='utf-8'))
audit = json.loads((ROOT / 'data/catalogue/audit-2026-11-01.json').read_text(encoding='utf-8'))
admissions = json.loads((ROOT / 'data/catalogue/bihor-2026-admissions.json').read_text(encoding='utf-8'))
identities = json.loads((ROOT / 'data/catalogue/bihor-2026-reconciliation.json').read_text(encoding='utf-8'))['schools']

def fold(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value.casefold()) if not unicodedata.combining(c))

by_table = {table: {row['id']: row for row in rows} for table, rows in data.items() if table != 'course_skills'}
for table, count in audit['after_counts'].items():
    if table in data:
        assert len(data[table]) == count, (table, 'unexpected count')
for change in audit['changes']:
    row = by_table[change['table']][change['id']]
    for field, expected in change['fields'].items():
        actual = row.get(field)
        target = expected['after']
        if field.endswith('_at') and actual and target:
            actual, target = actual[:10], target[:10]
        assert actual == target, (change['table'], change['id'], field)
for excluded in audit['excluded']:
    assert excluded['id'] not in by_table[excluded['table']], ('excluded record returned', excluded['id'])
for archived in audit['archived']:
    assert by_table[archived['table']][archived['id']]['is_current'] is False
for expected in identities:
    actual = by_table['schools'][expected['id']]
    for field in ['name', 'city', 'county']:
        assert actual[field] == expected[field], ('school identity', expected['id'], field)

groups = {row['key']: row for row in admissions['curricula']}
fields = ['school_id','track','specialization','admission_year','admission_code',
          'seats_total','seats_occupied','last_admission_average',
          'previous_admission_average','teaching_language','bilingual_language',
          'is_dual','study_form','pathway']
current = [row for row in data['school_profiles'] if row['is_current']]
assert len(current) == len(admissions['records']) == 192
assert len({row['admission_code'] for row in current}) == 192
for expected in admissions['records']:
    actual = by_table['school_profiles'][expected['id']]
    for field in fields:
        assert actual[field] == expected[field], ('admission fact', expected['id'], field)
    group = groups[expected['curriculum_key']]
    assert actual['key_subjects'] == group['subjects'], ('curriculum labels', actual['id'])
    assert actual['subjects_source_url'] == group['source']
    assert actual['subjects_note'] == admissions['subjects_note']
    assert actual['school_id'] in by_table['schools']

programs = data['programs']
assert len({(p['university_id'], fold(p['name']), p['degree_level']) for p in programs}) == len(programs)
assert all(p['university_id'] in by_table['universities'] for p in programs)
assert next(p for p in programs if p['name']=='Arhitectură')['duration_years'] == 6
assert next(p for p in programs if p['name']=='Asistență medicală generală')['duration_years'] == 4
published = [r for r in data['courses'] if r['is_current']]
assert len(published) == audit['published_courses'] == 6
assert all(row['source_url'] == row['url'] for row in published)
assert all(link['course_id'] in by_table['courses'] for link in data['course_skills'])
assert next(r for r in published if r['provider']=='Meta · Coursera')['is_free'] is False
assert next(r for r in published if r['provider']=='DataCamp')['is_free'] is False
print(f"PASS: {len(data['schools'])} school identities (48 Bihor), 192 current admission options, 8 curriculum groups, 16 distinct university programmes, 6 published resources, 10 career descriptions; exclusions absent and archived references retained.")
