-- Fixed profile choices and explicit institution counties.
-- NOT VALID preserves legacy profiles while enforcing choices on new writes.
alter table public.profiles add column if not exists sector smallint;
alter table public.profiles drop constraint if exists profiles_grade_level_check;
alter table public.profiles add constraint profiles_grade_level_check check (grade_level in ('V','VI','VII','VIII','IX','X','XI','XII','student'));
alter table public.profiles add constraint profiles_county_choice check (county in ('Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila','Brașov','București','Buzău','Călărași','Caraș-Severin','Cluj','Constanța','Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova','Sălaj','Satu Mare','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vâlcea','Vaslui','Vrancea')) not valid;
alter table public.profiles add constraint profiles_sector_choice check (
  (county = 'București' and sector is not null and sector between 1 and 6)
  or (county <> 'București' and sector is null)
) not valid;
alter table public.universities add column if not exists county text;
alter table public.universities add column if not exists description text;
-- Oradea is in Bihor; no other institution locations are guessed.
update public.universities set county = 'Bihor' where city = 'Oradea' and county is null;
alter table public.universities add constraint universities_county_choice check (county in ('Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila','Brașov','București','Buzău','Călărași','Caraș-Severin','Cluj','Constanța','Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova','Sălaj','Satu Mare','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vâlcea','Vaslui','Vrancea')) not valid;
create index if not exists idx_universities_county on public.universities(county);
alter table public.user_progress drop constraint if exists user_progress_step_type_check;
alter table public.user_progress add constraint user_progress_step_type_check check (step_type in ('school','university','program','course','skill'));
create unique index if not exists user_progress_owner_step_ref on public.user_progress(user_id,step_type,ref_id);
