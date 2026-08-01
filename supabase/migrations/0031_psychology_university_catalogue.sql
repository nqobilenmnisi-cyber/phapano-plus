-- =====================================================================
-- Migration 0031 — audited Psychology pathways at all 26 SA public
-- universities.
--
-- This is deliberately separate from `programmes`: that table represents
-- individual application plans (including multiple Master's streams), while
-- this table is the national coverage audit. A missing official source is
-- recorded as `not_verified`, never guessed to mean `not_offered`.
-- =====================================================================

begin;

create table if not exists public.psychology_university_catalogue (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  institution text not null unique,
  province text not null,
  institution_url text not null,
  levels jsonb not null,
  audit_source_url text not null,
  audit_note text,
  last_verified date not null,
  next_review_due date not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint psychology_catalogue_https check (
    institution_url like 'https://%' and audit_source_url like 'https://%'
  ),
  constraint psychology_catalogue_levels check (
    jsonb_typeof(levels) = 'object'
    and levels ?& array['undergraduate', 'honours', 'masters', 'doctoral']
    and levels #>> '{undergraduate,status}' in ('offered', 'not_offered', 'not_verified')
    and levels #>> '{honours,status}' in ('offered', 'not_offered', 'not_verified')
    and levels #>> '{masters,status}' in ('offered', 'not_offered', 'not_verified')
    and levels #>> '{doctoral,status}' in ('offered', 'not_offered', 'not_verified')
    and (
      levels #>> '{undergraduate,status}' <> 'offered'
      or levels #>> '{undergraduate,url}' like 'https://%'
    )
    and (
      levels #>> '{honours,status}' <> 'offered'
      or levels #>> '{honours,url}' like 'https://%'
    )
    and (
      levels #>> '{masters,status}' <> 'offered'
      or levels #>> '{masters,url}' like 'https://%'
    )
    and (
      levels #>> '{doctoral,status}' <> 'offered'
      or levels #>> '{doctoral,url}' like 'https://%'
    )
  )
);

create index if not exists idx_psychology_catalogue_published
  on public.psychology_university_catalogue (is_published, institution);

alter table public.psychology_university_catalogue enable row level security;
drop policy if exists "psychology_catalogue_public_read" on public.psychology_university_catalogue;
create policy "psychology_catalogue_public_read"
  on public.psychology_university_catalogue for select
  using (is_published = true);

-- Every URL below is an official university source. `not_verified` means the
-- current official catalogue did not provide enough evidence for Phapano+ to
-- publish a Psychology qualification at that level; it is not a claim that the
-- university can never offer one.
insert into public.psychology_university_catalogue
  (slug, institution, province, institution_url, levels, audit_source_url,
   audit_note, last_verified, next_review_due, is_published)
values
('cput','Cape Peninsula University of Technology','Western Cape','https://www.cput.ac.za',
 '{"undergraduate":{"status":"not_verified"},"honours":{"status":"not_verified"},"masters":{"status":"not_verified"},"doctoral":{"status":"not_verified"}}',
 'https://prospectus.cput.ac.za/','No Psychology qualification was located in the current official prospectus.',current_date,current_date + 90,true),
('cut','Central University of Technology','Free State','https://www.cut.ac.za',
 '{"undergraduate":{"status":"not_verified"},"honours":{"status":"not_verified"},"masters":{"status":"not_verified"},"doctoral":{"status":"not_verified"}}',
 'https://www.cut.ac.za/programmes-offered','No Psychology qualification was located in the official programmes list.',current_date,current_date + 90,true),
('dut','Durban University of Technology','KwaZulu-Natal','https://www.dut.ac.za',
 '{"undergraduate":{"status":"not_verified"},"honours":{"status":"not_verified"},"masters":{"status":"not_verified"},"doctoral":{"status":"not_verified"}}',
 'https://www.dut.ac.za/academic/','No Psychology qualification was located in the official academic programme directory.',current_date,current_date + 90,true),
('mut','Mangosuthu University of Technology','KwaZulu-Natal','https://www.mut.ac.za',
 '{"undergraduate":{"status":"not_verified"},"honours":{"status":"not_verified"},"masters":{"status":"not_verified"},"doctoral":{"status":"not_verified"}}',
 'https://www.mut.ac.za/faculties/','No Psychology qualification was located in the official faculty programme listings.',current_date,current_date + 90,true),
('nmu','Nelson Mandela University','Eastern Cape','https://www.mandela.ac.za',
 '{"undergraduate":{"status":"offered","title":"BA Psychology / BPsych Counselling","url":"https://ebeit.mandela.ac.za/ebeit/media/Store/Prospective%20Student%20Information/NMU_Int_Undergraduate_Programme_Guide.pdf"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://health.mandela.ac.za/health-new/media/Store/Documents/Prospectus/Prospectus-Faculty-of-Health-Sciences_1.pdf"},"masters":{"status":"offered","title":"Master of Arts in Psychology and professional routes","url":"https://psychology.mandela.ac.za/psychology/media/Store/documents/DPhil/Department-of-Psychology-Masters-PHD-Guidelines-2024-2025.pdf"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://psychology.mandela.ac.za/psychology/media/Store/documents/DPhil/Department-of-Psychology-Masters-PHD-Guidelines-2024-2025.pdf"}}',
 'https://psychology.mandela.ac.za/','Official programme guides distinguish academic research degrees from professional routes.',current_date,current_date + 90,true),
('nwu','North-West University','North West','https://www.nwu.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology majors in BA, BSocSci and BHSc routes","url":"https://health-sciences.nwu.ac.za/psychology"},"honours":{"status":"offered","title":"BHSc Honours in Psychology","url":"https://health-sciences.nwu.ac.za/psychology"},"masters":{"status":"offered","title":"Clinical, Counselling and Research Psychology","url":"https://health-sciences.nwu.ac.za/psychology"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://health-sciences.nwu.ac.za/psychosocial-health"}}',
 'https://health-sciences.nwu.ac.za/psychology','Offerings vary by campus; use the official page to confirm presentation site.',current_date,current_date + 90,true),
('rhodes','Rhodes University','Eastern Cape','https://www.ru.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology or Organisational Psychology in BA, BSc, BSocSc or BCom","url":"https://www.ru.ac.za/psychology/"},"honours":{"status":"offered","title":"Psychology Honours","url":"https://www.ru.ac.za/psychology/courses/psychologyhonours/"},"masters":{"status":"offered","title":"Professional programmes and MA by thesis","url":"https://www.ru.ac.za/psychology/courses/mastersphdbythesis/"},"doctoral":{"status":"offered","title":"PhD in Psychology by thesis","url":"https://www.ru.ac.za/psychology/courses/mastersphdbythesis/"}}',
 'https://www.ru.ac.za/psychology/','Research degrees do not lead to professional registration.',current_date,current_date + 90,true),
('smu','Sefako Makgatho Health Sciences University','Gauteng','https://www.smu.ac.za',
 '{"undergraduate":{"status":"not_verified"},"honours":{"status":"offered","title":"BSc Honours in Psychology","url":"https://www.smu.ac.za/schools/medicine/school-of-medicine-postgraduate-programmes/"},"masters":{"status":"offered","title":"MSc Clinical Psychology","url":"https://www.smu.ac.za/download/221/applications/276395/2026-som-calendar_postgraduate-programmes_final"},"doctoral":{"status":"not_verified"}}',
 'https://www.smu.ac.za/students/postgraduate-students/','The 2026 School of Medicine calendar verifies Honours and MSc Clinical Psychology only.',current_date,current_date + 90,true),
('spu','Sol Plaatje University','Northern Cape','https://www.spu.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology major in the Bachelor of Arts","url":"https://www.spu.ac.za/index.php/prospectus-2026/"},"honours":{"status":"not_verified"},"masters":{"status":"not_verified"},"doctoral":{"status":"not_verified"}}',
 'https://www.spu.ac.za/index.php/postgraduate-studies/','Psychology was verified as an undergraduate major; it is not listed in the current postgraduate catalogue.',current_date,current_date + 90,true),
('stellenbosch','Stellenbosch University','Western Cape','https://www.sun.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology major within selected bachelor degrees","url":"https://www0.sun.ac.za/psychology/programmes/"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://www0.sun.ac.za/psychology/programmes/"},"masters":{"status":"offered","title":"Clinical and research Psychology routes","url":"https://www0.sun.ac.za/psychology/programmes/"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www0.sun.ac.za/psychology/programmes/phd-in-psychology/"}}',
 'https://www0.sun.ac.za/psychology/programmes/','Stellenbosch does not describe Psychology as a standalone undergraduate degree.',current_date,current_date + 90,true),
('tut','Tshwane University of Technology','Gauteng','https://www.tut.ac.za',
 '{"undergraduate":{"status":"not_verified"},"honours":{"status":"not_verified"},"masters":{"status":"not_verified"},"doctoral":{"status":"not_verified"}}',
 'https://www.tut.ac.za/index.php/prospectus','No Psychology qualification was located in the current official prospectus.',current_date,current_date + 90,true),
('uct','University of Cape Town','Western Cape','https://www.uct.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology major in BA or BSocSci","url":"https://careers.uct.ac.za/faculties-and-departments-humanities-faculty/psychology"},"honours":{"status":"offered","title":"BSocSci Honours in Psychology","url":"https://humanities.uct.ac.za/department-psychology/overview-graduate-programmes"},"masters":{"status":"offered","title":"Clinical, Neuropsychology and research Psychology routes","url":"https://humanities.uct.ac.za/department-psychology/overview-graduate-programmes"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://humanities.uct.ac.za/department-psychology/overview-graduate-programmes"}}',
 'https://humanities.uct.ac.za/department-psychology/','The department overview is the controlling source for postgraduate routes.',current_date,current_date + 90,true),
('ufh','University of Fort Hare','Eastern Cape','https://www.ufh.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology in BA or BSocSci routes","url":"https://www.ufh.ac.za/faculties/faculty-of-social-sciences-and-humanities"},"honours":{"status":"offered","title":"BSocSci Honours in Psychology","url":"https://www.ufh.ac.za/course/bachelor-of-social-science-honours-psychology"},"masters":{"status":"offered","title":"Master of Social Science in Psychology","url":"https://www.ufh.ac.za/course/master-of-social-science-in-psychology-3"},"doctoral":{"status":"not_verified"}}',
 'https://www.ufh.ac.za/departments/psychology-social-work-criminology','No current direct official Psychology doctoral programme page was located.',current_date,current_date + 90,true),
('ufs','University of the Free State','Free State','https://www.ufs.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology in undergraduate degree routes","url":"https://www.ufs.ac.za/humanities/departments-and-divisions/psychology-home/general/frequently-asked-questions"},"honours":{"status":"offered","title":"BPsych Honours","url":"https://www.ufs.ac.za/humanities/departments-and-divisions/psychology-home/academic-information/honours-programme-in-psychology"},"masters":{"status":"offered","title":"Applied and research Psychology Master’s routes","url":"https://www.ufs.ac.za/humanities/departments-and-divisions/psychology-home/general/frequently-asked-questions"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www.ufs.ac.za/humanities/departments-and-divisions/psychology-home/general/frequently-asked-questions"}}',
 'https://www.ufs.ac.za/humanities/departments-and-divisions/psychology-home','Professional and research routes have different selection processes.',current_date,current_date + 90,true),
('uj','University of Johannesburg','Gauteng','https://www.uj.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology undergraduate major","url":"https://www.uj.ac.za/faculties/humanities/departments-2/psychology/courses-and-programs/"},"honours":{"status":"offered","title":"BA/BSc Honours in Psychology","url":"https://www.uj.ac.za/faculties/humanities/honours-psychology/"},"masters":{"status":"offered","title":"Clinical, Counselling and research Psychology","url":"https://www.uj.ac.za/faculties/humanities/departments-2/psychology/courses-and-programs/postgraduate/"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www.uj.ac.za/faculties/humanities/departments-2/psychology/courses-and-programs/postgraduate/"}}',
 'https://www.uj.ac.za/faculties/humanities/departments-2/psychology/courses-and-programs/postgraduate/','The current page lists each postgraduate route explicitly.',current_date,current_date + 90,true),
('ukzn','University of KwaZulu-Natal','KwaZulu-Natal','https://www.ukzn.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology undergraduate programme","url":"https://psychology.ukzn.ac.za/courses/"},"honours":{"status":"offered","title":"General and Industrial/Organisational Psychology Honours","url":"https://psychology.ukzn.ac.za/courses/"},"masters":{"status":"offered","title":"Clinical, Counselling, Educational, Research and I/O Psychology","url":"https://psychology.ukzn.ac.za/courses/"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://psychology.ukzn.ac.za/postgraduate/"}}',
 'https://psychology.ukzn.ac.za/selection-criteria-and-entrance-requirements/','Offerings and campuses differ by route; confirm campus on the official page.',current_date,current_date + 90,true),
('ul','University of Limpopo','Limpopo','https://www.ul.ac.za',
 '{"undergraduate":{"status":"offered","title":"BA Psychology / BPsych routes","url":"https://www.ul.ac.za/faculty-of-humanities/school-of-social-sciences/"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://www.ul.ac.za/wp-content/uploads/2023/11/Postgraduate-Prospectus-2027.pdf"},"masters":{"status":"offered","title":"MA Clinical Psychology and MA Psychology by research","url":"https://www.ul.ac.za/wp-content/uploads/2023/11/Postgraduate-Prospectus-2027.pdf"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www.ul.ac.za/wp-content/uploads/2023/11/Postgraduate-Prospectus-2027.pdf"}}',
 'https://www.ul.ac.za/wp-content/uploads/2023/11/Postgraduate-Prospectus-2027.pdf','Only routes named in the official 2027 prospectus are treated as verified.',current_date,current_date + 90,true),
('ump','University of Mpumalanga','Mpumalanga','https://www.ump.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology in the Bachelor of Arts","url":"https://www.ump.ac.za/getattachment/Study-with-us/Almanac/UMP-Almanac-2026.pdf.aspx?lang=en-US"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://www.ump.ac.za/Study-with-us/Faculties-and-Schools/Faculty-of-Economics%2C-Development-and-Business-Sci/School-of-Social-Sciences/Bachelor-of-Arts-Honours-in-Psychology.aspx"},"masters":{"status":"offered","title":"MA in Psychology by dissertation","url":"https://www.ump.ac.za/Study-with-us/Faculties-and-Schools/Faculty-of-Economics%2C-Development-and-Business-Sci/School-of-Social-Sciences/Master-of-Arts-in-Psychology.aspx"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www.ump.ac.za/getattachment/Study-with-us/Almanac/UMP-Almanac-2026.pdf.aspx?lang=en-US"}}',
 'https://www.ump.ac.za/getattachment/Study-with-us/Almanac/UMP-Almanac-2026.pdf.aspx?lang=en-US','Academic research routes; no professional registration claim is made.',current_date,current_date + 90,true),
('up','University of Pretoria','Gauteng','https://www.up.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology undergraduate routes","url":"https://www.up.ac.za/psychology"},"honours":{"status":"offered","title":"BSocSci Honours in Psychology","url":"https://www.up.ac.za/psychology/honours-programme"},"masters":{"status":"offered","title":"Professional and academic Psychology Master’s routes","url":"https://www.up.ac.za/psychology"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www.up.ac.za/psychology"}}',
 'https://www.up.ac.za/psychology','The current department page publishes 2027 intake information for all postgraduate levels.',current_date,current_date + 90,true),
('unisa','University of South Africa','Gauteng','https://www.unisa.ac.za',
 '{"undergraduate":{"status":"offered","title":"BA Psychology","url":"https://w2.unisa.ac.za/CW/SITES/CORPORAT/DEFAULT/COLLEGES/HUMAN_SC/SCHOOLS_/SCHOOL_O/DEPARTME/UNDERGRA/BACHELOR.HTM"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://www.unisa.ac.za/sites/corporate/default/Colleges/Human-Sciences/Schools%2C-departments%2C-centres%2C-institutes-%26-units/School-of-Social-Sciences/Department-of-Psychology/Postgraduate-Programmes/About-Honours-Programmes"},"masters":{"status":"offered","title":"MA Psychology and selected professional routes","url":"https://mobi.unisa.ac.za/sites/corporate/default/Colleges/Human-Sciences/Schools%2C-departments%2C-centres%2C-institutes-%26-units/School-of-Social-Sciences/Department-of-Psychology/Postgraduate-Programmes/About-Masters-%26-Doctoral-Programmes"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://w2.unisa.ac.za/CW/SITES/CORPORAT/DEFAULT/APPLY_FO/MASTER_S/QUALIFIC/ALL_QUAL/DOCT-103.HTM"}}',
 'https://mobi.unisa.ac.za/sites/corporate/default/Colleges/Human-Sciences/Schools%2C-departments%2C-centres%2C-institutes-%26-units/School-of-Social-Sciences/Department-of-Psychology/Postgraduate-Programmes/About-Masters-%26-Doctoral-Programmes','Academic degrees do not by themselves lead to HPCSA registration.',current_date,current_date + 90,true),
('univen','University of Venda','Limpopo','https://www.univen.ac.za',
 '{"undergraduate":{"status":"offered","title":"Bachelor of Psychology","url":"https://www.univen.ac.za/faculties/health/psychology/"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://www.univen.ac.za/faculties/health/psychology/"},"masters":{"status":"offered","title":"MA in Psychology","url":"https://www.univen.ac.za/wp-content/uploads/2026/02/22-2026_Fuculity-of-Health-Sciences-Calender__Final_Revised_November_20251-book2.pdf"},"doctoral":{"status":"offered","title":"Doctor of Psychology","url":"https://www.univen.ac.za/wp-content/uploads/2026/02/22-2026_Fuculity-of-Health-Sciences-Calender__Final_Revised_November_20251-book2.pdf"}}',
 'https://www.univen.ac.za/faculties/health/psychology/','Qualification titles follow the official 2026 Faculty of Health Sciences calendar.',current_date,current_date + 90,true),
('uwc','University of the Western Cape','Western Cape','https://www.uwc.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology undergraduate programme","url":"https://www.uwc.ac.za/study/all-areas-of-study/departments/department-of-psychology"},"honours":{"status":"offered","title":"BA Honours Psychology","url":"https://www.uwc.ac.za/study/all-areas-of-study/departments/department-of-psychology/postgraduate"},"masters":{"status":"offered","title":"Clinical, Research and thesis-only Psychology Master’s routes","url":"https://www.uwc.ac.za/study/all-areas-of-study/departments/department-of-psychology/postgraduate"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www.uwc.ac.za/study/all-areas-of-study/departments/department-of-psychology/postgraduate"}}',
 'https://www.uwc.ac.za/study/all-areas-of-study/departments/department-of-psychology/postgraduate','UWC explicitly states that it does not currently offer Counselling Psychology.',current_date,current_date + 90,true),
('wits','University of the Witwatersrand','Gauteng','https://www.wits.ac.za',
 '{"undergraduate":{"status":"offered","title":"Psychology undergraduate courses and major","url":"https://www.wits.ac.za/shcd/psychology/academic-programmes/"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://www.wits.ac.za/course-finder/postgraduate/humanities/bahons-psychology-/"},"masters":{"status":"offered","title":"Professional and research Psychology Master’s routes","url":"https://www.wits.ac.za/shcd/psychology/academic-programmes/"},"doctoral":{"status":"offered","title":"PhD in Psychology","url":"https://www.wits.ac.za/shcd/psychology/academic-programmes/"}}',
 'https://www.wits.ac.za/shcd/psychology/academic-programmes/','The official academic programmes page lists undergraduate through doctoral routes.',current_date,current_date + 90,true),
('unizulu','University of Zululand','KwaZulu-Natal','https://www.unizulu.ac.za',
 '{"undergraduate":{"status":"offered","title":"BA in Psychology","url":"https://www.arts.unizulu.ac.za/psychology/"},"honours":{"status":"offered","title":"BA Honours in Psychology","url":"https://www.arts.unizulu.ac.za/psychology-department/honors-degree/"},"masters":{"status":"not_verified"},"doctoral":{"status":"offered","title":"PhD in Community Psychology","url":"https://www.arts.unizulu.ac.za/psychology/"}}',
 'https://www.arts.unizulu.ac.za/psychology/','The current department page says its professional Master’s programmes are being revived, so none is published as currently available.',current_date,current_date + 90,true),
('vut','Vaal University of Technology','Gauteng','https://www.vut.ac.za',
 '{"undergraduate":{"status":"not_verified"},"honours":{"status":"not_verified"},"masters":{"status":"not_verified"},"doctoral":{"status":"not_verified"}}',
 'https://vut.ac.za/en_gb/programmes-faculty-of-human-sciences/','No Psychology qualification was located in the official Human Sciences programme directory.',current_date,current_date + 90,true),
('wsu','Walter Sisulu University','Eastern Cape','https://www.wsu.ac.za',
 '{"undergraduate":{"status":"offered","title":"Bachelor of Psychology","url":"https://wsu.ac.za/en/faculties-wsu/law-humanities-and-social-sciences/faculty-programmes"},"honours":{"status":"offered","title":"BSocSci Honours with Psychology route","url":"https://wsu.ac.za/en/faculties-wsu/law-humanities-and-social-sciences/faculty-programmes"},"masters":{"status":"offered","title":"Master of Arts in Psychology","url":"https://wsu.ac.za/en/faculties-wsu/law-humanities-and-social-sciences/faculty-programmes"},"doctoral":{"status":"not_verified"}}',
 'https://wsu.ac.za/en/faculties-wsu/law-humanities-and-social-sciences/faculty-programmes','The official faculty list does not currently name a Psychology doctoral qualification.',current_date,current_date + 90,true)
on conflict (slug) do update set
  institution = excluded.institution,
  province = excluded.province,
  institution_url = excluded.institution_url,
  levels = excluded.levels,
  audit_source_url = excluded.audit_source_url,
  audit_note = excluded.audit_note,
  last_verified = excluded.last_verified,
  next_review_due = excluded.next_review_due,
  is_published = excluded.is_published,
  updated_at = now();

-- Replace the public planning list with one conservative, audited Honours and
-- Master's overview per institution. Existing rows and saved plans remain in
-- place, but unverified legacy seeds are no longer shown in discovery.
alter table public.programmes add column if not exists programme_title text;
alter table public.programmes add column if not exists verification_status text not null default 'unverified';
alter table public.programmes add column if not exists is_published boolean not null default true;

alter table public.programmes drop constraint if exists programmes_verification_status_check;
alter table public.programmes add constraint programmes_verification_status_check
  check (verification_status in ('verified', 'unverified', 'needs_review'));

update public.programmes
set is_published = false,
    verification_status = case
      when verification_status = 'verified' then verification_status
      else 'needs_review'
    end,
    updated_at = now();

insert into public.programmes
  (slug, institution, institution_url, qualification, stream, province, status,
   programme_title, programme_url, primary_source_url, last_verified,
   last_checked, needs_review, verification_status, is_published)
select
  'audit-' || slug || '-honours', institution, institution_url, 'honours', null,
  province, 'dates_not_confirmed', levels #>> '{honours,title}',
  levels #>> '{honours,url}', levels #>> '{honours,url}', last_verified,
  now(), false, 'verified', true
from public.psychology_university_catalogue
where is_published and levels #>> '{honours,status}' = 'offered'
on conflict (slug) do update set
  institution = excluded.institution,
  institution_url = excluded.institution_url,
  qualification = excluded.qualification,
  stream = excluded.stream,
  province = excluded.province,
  status = excluded.status,
  programme_title = excluded.programme_title,
  programme_url = excluded.programme_url,
  primary_source_url = excluded.primary_source_url,
  last_verified = excluded.last_verified,
  last_checked = excluded.last_checked,
  needs_review = excluded.needs_review,
  verification_status = excluded.verification_status,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.programmes
  (slug, institution, institution_url, qualification, stream, province, status,
   programme_title, programme_url, primary_source_url, last_verified,
   last_checked, needs_review, verification_status, is_published)
select
  'audit-' || slug || '-masters', institution, institution_url, 'masters', 'other',
  province, 'dates_not_confirmed', levels #>> '{masters,title}',
  levels #>> '{masters,url}', levels #>> '{masters,url}', last_verified,
  now(), false, 'verified', true
from public.psychology_university_catalogue
where is_published and levels #>> '{masters,status}' = 'offered'
on conflict (slug) do update set
  institution = excluded.institution,
  institution_url = excluded.institution_url,
  qualification = excluded.qualification,
  stream = excluded.stream,
  province = excluded.province,
  status = excluded.status,
  programme_title = excluded.programme_title,
  programme_url = excluded.programme_url,
  primary_source_url = excluded.primary_source_url,
  last_verified = excluded.last_verified,
  last_checked = excluded.last_checked,
  needs_review = excluded.needs_review,
  verification_status = excluded.verification_status,
  is_published = excluded.is_published,
  updated_at = now();

create index if not exists idx_programmes_published
  on public.programmes (is_published, qualification, institution);

-- Fail closed if the national audit is incomplete.
do $$
begin
  if (select count(*) from public.psychology_university_catalogue where is_published) <> 26 then
    raise exception 'Psychology university catalogue must contain exactly 26 published institutions';
  end if;
  if (select count(*) from public.programmes where is_published and qualification = 'honours') <> 19 then
    raise exception 'Audited Psychology Honours planner must contain exactly 19 institutions';
  end if;
  if (select count(*) from public.programmes where is_published and qualification = 'masters') <> 18 then
    raise exception 'Audited Psychology Masters planner must contain exactly 18 institutions';
  end if;
end $$;

commit;

-- Verification SQL (run after staging and production migration):
-- select count(*) as published_universities from public.psychology_university_catalogue where is_published;
-- select qualification, count(*) from public.programmes where is_published group by qualification order by qualification;
-- select institution, levels #>> '{undergraduate,status}' as undergraduate,
--   levels #>> '{honours,status}' as honours, levels #>> '{masters,status}' as masters,
--   levels #>> '{doctoral,status}' as doctoral
-- from public.psychology_university_catalogue where is_published order by institution;
