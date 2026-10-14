# Data TODO - Missing Verified Data

According to the master prompt, all data in the NextStep app must be verified with sources. This file tracks any missing verified data that needs to be researched and added.

## Missing Verified Data

### Schools (Licee)

- [ ] Verified data for all 20+ school profiles
  - Each school needs: name, city, county, website, description, source_url, verified_at
  - Each school profile needs: school_id, track, specialization, key_subjects, admission_notes, source_url, verified_at

### Universities (Facultăți)

- [ ] Verified data for all 20+ university programs
  - Each university needs: name, city, website, source_url, verified_at
  - Each program needs: university_id, name, degree_level, duration_years, description, source_url, verified_at

### Careers (Cariere)

- [ ] Verified data for all 30+ careers
  - Each career needs: name, description, domain, source_url, verified_at

### Skills

- [ ] Verified data for all 60+ skills
  - Each skill needs: name, category

### Courses (Cursuri)

- [ ] Verified data for all 100+ courses
  - Each course needs: title, provider, url, language, is_free, level, source_url, verified_at

## Junction Tables Data

- [ ] Career skills junction data (career_skills)
- [ ] Program skills junction data (program_skills)
- [ ] Program careers junction data (program_careers)
- [ ] School profile programs junction data (school_profile_programs)
- [ ] Course skills junction data (course_skills)

## Sources to Research

- Ministry of Education website (edu.ro)
- Individual school websites
- University websites
- Career guidance websites (ciso.ro, etc.)
- Course providers (Coursera, edX, local platforms)
- Official Romanian education databases

## Notes

All data must carry a source_url and verified_at date.
If data cannot be verified, it should be left out and noted in this file.
