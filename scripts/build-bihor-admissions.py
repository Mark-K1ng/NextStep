"""Build the reviewed 2026 admission seed from saved Ministry snapshots.

No network or database writes. Reuses nine unambiguously matched legacy IDs.
"""
import json
import unicodedata
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data/catalogue'
snapshot = json.loads((DATA / 'bihor-2026-specialization.json').read_text(encoding='utf-8'))
schools = json.loads((DATA / 'bihor-2026-reconciliation.json').read_text(encoding='utf-8'))['schools']
school_ids = {row['official_code']: row['id'] for row in schools}
assert snapshot['admission_year'] == 2026 and len(snapshot['records']) == 192
assert len({row['c'] for row in snapshot['records']}) == 192

LEGACY_IDS = {
    '130': 'd9d2072d-1f13-4ef4-aae0-fb452e013067',
    '131': 'acc37799-c8d8-425a-b093-5664807aeb5d',
    '106': '77cc7c60-e2fc-46bf-ac19-4c2de304b7ea',
    '109': '425876af-7a67-49d9-abfa-701474172830',
    '110': 'cd963086-cc66-4091-9227-3463a66fc865',
    '111': 'efbfcf47-509a-40bc-aab4-53121541c1d8',
    '145': 'ee9e8b9b-63a5-4a45-b0f9-cc17f52b35cf',
    '146': '6f318bd1-15ba-49ce-b7cc-3080c612a64c',
    '147': '4ee7548e-d628-4c1b-87df-2c6bc9fdbd1c',
}
PDF = 'https://rocnee.eu/images/rocnee/fisiere/planuri-cadru/OMEC%20nr.%204152_2026_modificare%20planuri%20-cadru_MOf.nr.%20565Bis_opt.pdf'
NOTE = 'Discipline orientative din planul-cadru național, nu probe de admitere. Oferta și orarul pot varia, inclusiv la clasele bilingve sau cu predare în limbile minorităților.'
CURRICULA = {
    'math': (43, ['Matematică', 'Informatică', 'Fizică', 'Chimie']),
    'nature': (46, ['Biologie', 'Chimie', 'Fizică', 'Matematică']),
    'social': (49, ['Istorie', 'Geografie', 'Disciplină socio-umană', 'Limba și literatura română']),
    'philology': (53, ['Limba și literatura română', 'Limba modernă 1', 'Limba modernă 2', 'Limba latină', 'Literatură universală']),
    'technical': (57, ['Matematică', 'Fizică', 'Chimie', 'Pregătire teoretică de specialitate', 'Pregătire practică de specialitate']),
    'resources': (60, ['Biologie', 'Chimie', 'Matematică', 'Pregătire teoretică de specialitate', 'Pregătire practică de specialitate']),
    'economic': (63, ['Matematică', 'Limba modernă 1', 'Pregătire teoretică de specialitate', 'Pregătire practică de specialitate']),
    'services': (66, ['Limba modernă 1', 'Matematică', 'Pregătire teoretică de specialitate', 'Pregătire practică de specialitate']),
}

def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value.casefold()) if not unicodedata.combining(c))

def average(value):
    if value in (None, '', '-'):
        return None
    result = float(value)
    assert 1 <= result <= 10
    return result

def curriculum(row):
    name = normalize(row['sp'])
    if row['f'] == 'Teoretică':
        if name == 'matematica-informatica': return 'math'
        if name == 'stiinte ale naturii': return 'nature'
        if name == 'stiinte sociale': return 'social'
        if name == 'filologie': return 'philology'
        raise ValueError('Unknown theoretical specialization: ' + row['sp'])
    if row['p'] == 'Tehnic': return 'technical'
    if row['p'] == 'Resurse naturale și protecția mediului': return 'resources'
    assert row['p'] == 'Servicii'
    return 'economic' if 'economice' in name or 'administratie' in name else 'services'

records = []
for row in snapshot['records']:
    assert row['j'] == 'BH' and row['lc'] in school_ids
    total, occupied = int(row['nlt']), int(row['nlo'])
    assert 0 <= occupied <= total
    records.append({
        'id': LEGACY_IDS.get(row['c'], str(uuid.uuid5(uuid.NAMESPACE_URL, f"https://static.admitere.edu.ro/2026/BH/option/{row['c']}"))),
        'school_id': school_ids[row['lc']], 'track': row['p'],
        'specialization': row['sp'].replace('Ş', 'Ș').replace('ţ', 'ț'),
        'admission_year': 2026, 'admission_code': row['c'],
        'seats_total': total, 'seats_occupied': occupied,
        'last_admission_average': average(row['um']),
        'previous_admission_average': average(row['uma']),
        'teaching_language': row['lp'],
        'bilingual_language': None if row['lb'] in ('', '-', None) else row['lb'],
        'is_dual': row['d'] == 'DA', 'study_form': row['fi'], 'pathway': row['f'],
        'curriculum_key': curriculum(row),
    })
groups = [{'key': key, 'subjects': subjects, 'source': f'{PDF}#page={page}'} for key, (page, subjects) in CURRICULA.items()]
manifest = {'source_url': snapshot['source_url'], 'verified_at': snapshot['verified_at'], 'admission_year': 2026, 'subjects_note': NOTE, 'curricula': groups, 'records': records}
(DATA / 'bihor-2026-admissions.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
fields = {
    'id': 'uuid', 'school_id': 'uuid', 'track': 'text', 'specialization': 'text',
    'admission_year': 'smallint', 'admission_code': 'text', 'seats_total': 'integer', 'seats_occupied': 'integer',
    'last_admission_average': 'numeric', 'previous_admission_average': 'numeric',
    'teaching_language': 'text', 'bilingual_language': 'text', 'is_dual': 'boolean', 'study_form': 'text', 'pathway': 'text', 'curriculum_key': 'text',
}
columns = [key for key in fields if key != 'curriculum_key']
extra = ['key_subjects', 'source_url', 'verified_at', 'admission_notes', 'subjects_source_url', 'subjects_note', 'is_current']
payload = json.dumps(records, ensure_ascii=False, separators=(',', ':'))
assert '$offers$' not in payload
school_list = ','.join("'" + value + "'" for value in school_ids.values())
sql = f'''-- Generated by scripts/build-bihor-admissions.py; primary-source metadata in data/catalogue/bihor-2026-admissions.json.
-- Run structured_school_admissions migration first. No deletes; preserve legacy IDs/references.
BEGIN;
UPDATE public.school_profiles SET is_current=false WHERE school_id IN ({school_list}) AND admission_year IS NULL;
WITH incoming AS (
SELECT * FROM jsonb_to_recordset($offers${payload}$offers$::jsonb) AS p({','.join(key+' '+kind for key,kind in fields.items())})
), curricula AS (
SELECT * FROM jsonb_to_recordset($curricula${json.dumps(groups, ensure_ascii=False, separators=(',', ':'))}$curricula$::jsonb) AS c(key text,subjects text[],source text)
)
INSERT INTO public.school_profiles ({','.join(columns+extra)})
SELECT {','.join('p.'+key for key in columns)},c.subjects,
'https://static.admitere.edu.ro/2026/repartizare/BH/index.html#specialization','2026-10-24T00:00:00Z',
'Rezultatele repartizării computerizate din 2026.',c.source,
'{NOTE}',true
FROM incoming p JOIN curricula c ON c.key=p.curriculum_key
ON CONFLICT(id) DO UPDATE SET {','.join(key+'=excluded.'+key for key in columns+extra if key!='id')};
COMMIT;
'''
(ROOT / 'supabase/seed/015_bihor_2026_admissions.sql').write_text(sql, encoding='utf-8')
print(f'Prepared {len(records)} options for {len(set(row["school_id"] for row in records))} schools; {len(LEGACY_IDS)} legacy IDs reused; {len(sql)} SQL characters.')
