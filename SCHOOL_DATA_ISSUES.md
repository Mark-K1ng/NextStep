# School Data Integrity Issues

## Critical Findings

The database contains 45 schools, but many have incorrect classifications or locations:

### Schools that are NOT "Colegiul Național" (misclassified):
1. **Colegiul Național "Alexandru Roman"** (Aleșd) - Actually: Colegiul Tehnic "Alexandru Roman"
2. **Colegiul Național "Bogdan Vodă"** (Sânnicolau Român) - Actually: Liceul Teoretic "Bogdan Vodă"
3. **Colegiul Național "Gheorghe Barițiu"** (Sântandrei) - This school doesn't exist in Bihor (exists in Cluj, Baia Mare, Sibiu, Brașov)
4. **Colegiul Național "Gheorghe Șincai"** (Marghita) - This school doesn't exist in Bihor (exists in Baia Mare, București)
5. **Colegiul Național "Sámuel Brassai"** (Sânnicolau Român) - This school is in Cluj-Napoca, not Bihor

### Schools that are in WRONG COUNTY:
1. **Colegiul Național "Andrei Mureșanu"** (Nucet, Bihor) - Actually in Bistrița-Năsăud
2. **Colegiul Național "Emil Racoviță"** (Oradea, Bihor) - Actually in Cluj-Napoca
3. **Colegiul Național "George Coșbuc"** (Oradea, Bihor) - Actually in Năsăud (or București - bilingual version)

### Actual Colegiul Naționale in Bihor County (verified from ISJ Bihor):
1. Colegiul Național "Emanuil Gojdu" Oradea ✓
2. Colegiul Național "Iosif Vulcan" Oradea ✓
3. Colegiul Național "Mihai Eminescu" Oradea ✓
4. Colegiul Național "Onisifor Ghibu" Oradea ✓
5. Colegiul Național "Samuil Vulcan" Beiuș ✓
6. Colegiul Național "Teodor Neș" Salonta ✓
7. Colegiul Național "Octavian Goga" Marghita ✓
8. Colegiul Național "Avram Iancu" Ștei ✓

## Recommendation

The database needs a complete data cleanup to:
1. Correct school classifications (Colegiul Național vs Colegiul Tehnic vs Liceu Teoretic)
2. Correct school locations/county assignments
3. Remove schools that don't exist in the specified locations
4. Add missing accurate school data

For this task, I will only update descriptions for schools that can be verified from official sources and add notes for schools with data issues.
