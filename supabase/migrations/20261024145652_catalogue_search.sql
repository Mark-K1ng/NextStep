-- Search and county filtering happen before a single bounded page is returned.
CREATE OR REPLACE FUNCTION public.catalogue_fold(value text)
RETURNS text LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path='' AS $$
 SELECT translate(lower(coalesce(value,'')), 'ăâîșşțţ', 'aaisstt');
$$;
REVOKE ALL ON FUNCTION public.catalogue_fold(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.catalogue_fold(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.search_catalogue(
 p_section text DEFAULT '', p_search text DEFAULT '', p_filter text DEFAULT '',
 p_county text DEFAULT '', p_offset integer DEFAULT 0, p_limit integer DEFAULT 21
) RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
WITH items("id","type","name","title","description","county","domain","provider","specialization","track","subjects","sourceUrl","verifiedAt") AS (
SELECT t.id,
       'skills'::text,
       t.name,
       NULL::text,
       NULL::text,
       NULL::text,
       t.category,
       NULL::text,
       NULL::text,
       NULL::text,
       NULL::jsonb,
       NULL::text,
       NULL::timestamptz
FROM public.skills t
WHERE (coalesce(p_section,'')='' OR p_section='skills')
UNION ALL
SELECT t.id,
       'schools'::text,
       t.name,
       NULL::text,
       t.description,
       t.county,
       NULL::text,
       NULL::text,
       (SELECT string_agg(DISTINCT p.specialization, ' · ' ORDER BY p.specialization) FROM public.school_profiles p WHERE p.school_id=t.id AND p.is_current),
       NULL::text,
       NULL::jsonb,
       t.source_url,
       t.verified_at
FROM public.schools t
WHERE (coalesce(p_section,'')='' OR p_section='schools') AND t.county=p_county
UNION ALL
SELECT t.id,
       'school_profiles'::text,
       t.specialization,
       NULL::text,
       concat_ws(' · ',parent.name,t.teaching_language,t.bilingual_language,CASE WHEN t.is_dual THEN 'Dual' END,t.admission_code),
       parent.county,
       NULL::text,
       NULL::text,
       t.specialization,
       t.track,
       to_jsonb(t.key_subjects),
       t.source_url,
       t.verified_at
FROM public.school_profiles t JOIN public.schools parent ON parent.id=t.school_id
WHERE (coalesce(p_section,'')='' OR p_section='school_profiles') AND parent.county=p_county AND t.is_current
UNION ALL
SELECT t.id,
       'universities'::text,
       t.name,
       NULL::text,
       t.description,
       t.county,
       NULL::text,
       NULL::text,
       NULL::text,
       NULL::text,
       NULL::jsonb,
       t.source_url,
       t.verified_at
FROM public.universities t
WHERE (coalesce(p_section,'')='' OR p_section='universities') AND t.county=p_county
UNION ALL
SELECT t.id,
       'programs'::text,
       t.name,
       NULL::text,
       concat_ws(' · ',parent.name,t.description),
       parent.county,
       t.degree_level,
       NULL::text,
       NULL::text,
       NULL::text,
       NULL::jsonb,
       t.source_url,
       t.verified_at
FROM public.programs t JOIN public.universities parent ON parent.id=t.university_id
WHERE (coalesce(p_section,'')='' OR p_section='programs') AND parent.county=p_county
UNION ALL
SELECT t.id,
       'careers'::text,
       t.name,
       NULL::text,
       t.description,
       NULL::text,
       t.domain,
       NULL::text,
       NULL::text,
       NULL::text,
       NULL::jsonb,
       t.source_url,
       t.verified_at
FROM public.careers t
WHERE (coalesce(p_section,'')='' OR p_section='careers')
UNION ALL
SELECT t.id,
       'courses'::text,
       t.title,
       t.title,
       concat_ws(' · ',t.language,t.level),
       NULL::text,
       t.level,
       t.provider,
       NULL::text,
       NULL::text,
       NULL::jsonb,
       t.source_url,
       t.verified_at
FROM public.courses t
WHERE (coalesce(p_section,'')='' OR p_section='courses')
), matching AS (
 SELECT * FROM items
 WHERE strpos(public.catalogue_fold(concat_ws(' ',name,description,specialization,domain,provider,track)),public.catalogue_fold(left(trim(coalesce(p_search,'')),200)))>0
 AND strpos(public.catalogue_fold(concat_ws(' ',county,domain,specialization,track,description)),public.catalogue_fold(left(trim(coalesce(p_filter,'')),200)))>0
)
SELECT jsonb_strip_nulls(to_jsonb(matching)) FROM matching
ORDER BY public.catalogue_fold(name),type,id
LIMIT greatest(1,least(coalesce(p_limit,21),51))
OFFSET greatest(0,least(coalesce(p_offset,0),100000));
$$;
REVOKE ALL ON FUNCTION public.search_catalogue(text,text,text,text,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_catalogue(text,text,text,text,integer,integer) TO authenticated;
