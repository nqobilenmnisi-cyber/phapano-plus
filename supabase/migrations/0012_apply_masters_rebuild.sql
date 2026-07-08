-- =====================================================================
-- Migration 0012 — Apply: rebuild the Psychology Master's directory from a
-- verified source matrix (HPCSA registration categories + official university
-- department/programme pages, across faculties — Humanities, Health Sciences,
-- Commerce and Economic & Management Sciences).
--
-- SAFE to run once. It DELETES the previous (inaccurate) master's seed and
-- reinserts only programmes verified against official university pages this
-- cycle. Honours rows are left untouched. saved_programmes rows that pointed at
-- removed master's programmes are cleared by the existing on-delete cascade.
--
-- ACCURACY NOTES:
--  * Every row below was confirmed on an official .ac.za page or the HPCSA
--    accredited-institutions list. Programmes that could not be confirmed this
--    cycle are intentionally excluded (see MERGE-GUIDE audit).
--  * Neuropsychology: UCT only (SACNA/HPCSA — the only MA Neuropsychology in SA).
--  * Cross-faculty: UCT I/O = Commerce; UNISA I/O = Econ & Mgmt Sciences;
--    NWU psychology = Health Sciences.
--  * Volatile fields (fees, requirements) left NULL. Closing dates set only
--    where an official page stated them for the current cycle.
-- =====================================================================

begin;

-- 1) Clear the previous master's seed (keep Honours).
delete from public.programmes where qualification = 'masters';

-- 2) Reinsert the verified matrix.
insert into public.programmes
  (slug, institution, institution_url, qualification, stream, province, status,
   closing_date, department_url, programme_url, last_verified, needs_review)
values
-- University of Cape Town (Western Cape) — Clinical, Research, Neuropsychology, I/O
('uct-masters-clinical','University of Cape Town','https://www.uct.ac.za','masters','clinical','Western Cape','verified',
 null,'https://humanities.uct.ac.za/department-psychology','https://humanities.uct.ac.za/department-psychology/overview-graduate-programmes',current_date,false),
('uct-masters-research','University of Cape Town','https://www.uct.ac.za','masters','research','Western Cape','verified',
 '2026-08-31','https://humanities.uct.ac.za/department-psychology','https://humanities.uct.ac.za/department-psychology/graduate-programmes/master-arts-psychological-research',current_date,false),
('uct-masters-neuropsychology','University of Cape Town','https://www.uct.ac.za','masters','neuropsychology','Western Cape','verified',
 '2026-08-31','https://humanities.uct.ac.za/department-psychology','https://humanities.uct.ac.za/department-psychology/graduate-programmes-masters-degrees/master-arts-neuro-psychology',current_date,false),
('uct-masters-io','University of Cape Town','https://www.uct.ac.za','masters','industrial_organisational','Western Cape','verified',
 null,'https://commerce.uct.ac.za/industrial-organisational-psychology','https://commerce.uct.ac.za/industrial-organisational-psychology/programmes-postgraduate-programmes/master-industrial-and-organisational-psychology',current_date,false),

-- University of the Witwatersrand (Gauteng) — Clinical, Counselling, Educational, I/O, Research
('wits-masters-clinical','University of the Witwatersrand','https://www.wits.ac.za','masters','clinical','Gauteng','verified',
 null,'https://www.wits.ac.za/shcd/psychology/',null,current_date,false),
('wits-masters-counselling','University of the Witwatersrand','https://www.wits.ac.za','masters','counselling','Gauteng','verified',
 null,'https://www.wits.ac.za/shcd/psychology/',null,current_date,false),
('wits-masters-educational','University of the Witwatersrand','https://www.wits.ac.za','masters','educational','Gauteng','verified',
 null,'https://www.wits.ac.za/shcd/psychology/',null,current_date,false),
('wits-masters-io','University of the Witwatersrand','https://www.wits.ac.za','masters','industrial_organisational','Gauteng','verified',
 null,'https://www.wits.ac.za/shcd/psychology/',null,current_date,false),
('wits-masters-research','University of the Witwatersrand','https://www.wits.ac.za','masters','research','Gauteng','verified',
 null,'https://www.wits.ac.za/shcd/psychology/',null,current_date,false),

-- University of Pretoria (Gauteng) — Clinical, Counselling, Educational, Research, I/O
('up-masters-clinical','University of Pretoria','https://www.up.ac.za','masters','clinical','Gauteng','verified',
 null,'https://www.up.ac.za/psychology',null,current_date,false),
('up-masters-counselling','University of Pretoria','https://www.up.ac.za','masters','counselling','Gauteng','verified',
 null,'https://www.up.ac.za/psychology',null,current_date,false),
('up-masters-educational','University of Pretoria','https://www.up.ac.za','masters','educational','Gauteng','verified',
 null,'https://www.up.ac.za/psychology',null,current_date,false),
('up-masters-research','University of Pretoria','https://www.up.ac.za','masters','research','Gauteng','verified',
 '2026-05-31','https://www.up.ac.za/psychology',null,current_date,false),
('up-masters-io','University of Pretoria','https://www.up.ac.za','masters','industrial_organisational','Gauteng','verified',
 null,'https://www.up.ac.za/psychology',null,current_date,false),

-- University of Johannesburg (Gauteng) — Clinical, Counselling
('uj-masters-clinical','University of Johannesburg','https://www.uj.ac.za','masters','clinical','Gauteng','verified',
 '2026-06-13','https://www.uj.ac.za/faculties/humanities/departments/psychology/','https://www.uj.ac.za/faculties/humanities/ma-psychology-clinical-psychology/',current_date,false),
('uj-masters-counselling','University of Johannesburg','https://www.uj.ac.za','masters','counselling','Gauteng','verified',
 '2026-06-14','https://www.uj.ac.za/faculties/humanities/departments/psychology/','https://www.uj.ac.za/faculties/humanities/ma-psychology-counseling-psychology/',current_date,false),

-- University of KwaZulu-Natal (KwaZulu-Natal) — Clinical, Counselling, Educational, Research, I/O
('ukzn-masters-clinical','University of KwaZulu-Natal','https://www.ukzn.ac.za','masters','clinical','KwaZulu-Natal','verified',
 null,'https://psychology.ukzn.ac.za/',null,current_date,false),
('ukzn-masters-counselling','University of KwaZulu-Natal','https://www.ukzn.ac.za','masters','counselling','KwaZulu-Natal','verified',
 null,'https://psychology.ukzn.ac.za/',null,current_date,false),
('ukzn-masters-educational','University of KwaZulu-Natal','https://www.ukzn.ac.za','masters','educational','KwaZulu-Natal','verified',
 null,'https://psychology.ukzn.ac.za/',null,current_date,false),
('ukzn-masters-research','University of KwaZulu-Natal','https://www.ukzn.ac.za','masters','research','KwaZulu-Natal','verified',
 null,'https://psychology.ukzn.ac.za/',null,current_date,false),
('ukzn-masters-io','University of KwaZulu-Natal','https://www.ukzn.ac.za','masters','industrial_organisational','KwaZulu-Natal','verified',
 null,'https://psychology.ukzn.ac.za/',null,current_date,false),

-- University of the Western Cape (Western Cape) — Clinical, Research (no Counselling)
('uwc-masters-clinical','University of the Western Cape','https://www.uwc.ac.za','masters','clinical','Western Cape','verified',
 '2026-08-31','https://www.uwc.ac.za/study/all-areas-of-study/departments/department-of-psychology/postgraduate',null,current_date,false),
('uwc-masters-research','University of the Western Cape','https://www.uwc.ac.za','masters','research','Western Cape','verified',
 '2026-08-31','https://www.uwc.ac.za/study/all-areas-of-study/departments/department-of-psychology/postgraduate',null,current_date,false),

-- University of South Africa (Gauteng / distance) — Clinical, Counselling, Research, I/O
('unisa-masters-clinical','University of South Africa','https://www.unisa.ac.za','masters','clinical','Gauteng','verified',
 '2026-05-22','https://www.unisa.ac.za/sites/corporate/default/Colleges/Human-Sciences/Schools,-departments,-centres,-institutes-&-units/School-of-Social-Sciences/Department-of-Psychology','https://www.unisa.ac.za/sites/corporate/default/Colleges/Human-Sciences/Schools,-departments,-centres,-institutes-&-units/School-of-Social-Sciences/Department-of-Psychology/Postgraduate-Programmes/MA-in-Clinical-Psychology',current_date,false),
('unisa-masters-counselling','University of South Africa','https://www.unisa.ac.za','masters','counselling','Gauteng','verified',
 null,'https://www.unisa.ac.za/sites/corporate/default/Colleges/Human-Sciences/Schools,-departments,-centres,-institutes-&-units/School-of-Social-Sciences/Department-of-Psychology',null,current_date,false),
('unisa-masters-research','University of South Africa','https://www.unisa.ac.za','masters','research','Gauteng','verified',
 null,'https://www.unisa.ac.za/sites/corporate/default/Colleges/Human-Sciences/Schools,-departments,-centres,-institutes-&-units/School-of-Social-Sciences/Department-of-Psychology',null,current_date,false),
('unisa-masters-io','University of South Africa','https://www.unisa.ac.za','masters','industrial_organisational','Gauteng','verified',
 null,'https://www.unisa.ac.za/sites/corporate/default/Colleges/Economic-and-Management-Sciences/Schools,-departments,-bureau,-centres-&-institutes/School-of-Management-Sciences/Department-of-Industrial-and-Organisational-Psychology','https://www.unisa.ac.za/sites/corporate/default/Colleges/Economic-and-Management-Sciences/Schools,-departments,-bureau,-centres-&-institutes/School-of-Management-Sciences/Department-of-Industrial-and-Organisational-Psychology/Masters-degrees',current_date,false),

-- University of Limpopo (Limpopo) — Clinical, Counselling, Educational, I/O, Research
('ul-masters-clinical','University of Limpopo','https://www.ul.ac.za','masters','clinical','Limpopo','verified',
 null,'https://www.ul.ac.za/faculty-of-humanities/school-of-social-sciences/department-of-psychology/',null,current_date,false),
('ul-masters-counselling','University of Limpopo','https://www.ul.ac.za','masters','counselling','Limpopo','verified',
 null,'https://www.ul.ac.za/faculty-of-humanities/school-of-social-sciences/department-of-psychology/',null,current_date,false),
('ul-masters-educational','University of Limpopo','https://www.ul.ac.za','masters','educational','Limpopo','verified',
 null,'https://www.ul.ac.za/faculty-of-humanities/school-of-social-sciences/department-of-psychology/',null,current_date,false),
('ul-masters-io','University of Limpopo','https://www.ul.ac.za','masters','industrial_organisational','Limpopo','verified',
 null,'https://www.ul.ac.za/faculty-of-humanities/school-of-social-sciences/department-of-psychology/',null,current_date,false),
('ul-masters-research','University of Limpopo','https://www.ul.ac.za','masters','research','Limpopo','verified',
 null,'https://www.ul.ac.za/faculty-of-humanities/school-of-social-sciences/department-of-psychology/',null,current_date,false),

-- Rhodes University (Eastern Cape) — Clinical, Counselling
('ru-masters-clinical','Rhodes University','https://www.ru.ac.za','masters','clinical','Eastern Cape','verified',
 null,'https://www.ru.ac.za/psychology/',null,current_date,false),
('ru-masters-counselling','Rhodes University','https://www.ru.ac.za','masters','counselling','Eastern Cape','verified',
 null,'https://www.ru.ac.za/psychology/','https://www.ru.ac.za/psychology/courses/mastersincounsellingpsychology/',current_date,false),

-- Stellenbosch University (Western Cape) — Clinical (merged clinical & community counselling)
('su-masters-clinical','Stellenbosch University','https://www.sun.ac.za','masters','clinical','Western Cape','verified',
 '2026-05-30','https://www0.sun.ac.za/psychology/','https://www0.sun.ac.za/psychology/programmes/master-of-arts-clinical-psychology/',current_date,false),

-- North-West University (North West) — Clinical, Counselling, Research, Educational (Health Sciences)
('nwu-masters-clinical','North-West University','https://www.nwu.ac.za','masters','clinical','North West','verified',
 '2026-06-28','https://health-sciences.nwu.ac.za/psychology',null,current_date,false),
('nwu-masters-counselling','North-West University','https://www.nwu.ac.za','masters','counselling','North West','verified',
 null,'https://health-sciences.nwu.ac.za/psychology','https://health-sciences.nwu.ac.za/compres/mhsc-counselling-psychology',current_date,false),
('nwu-masters-research','North-West University','https://www.nwu.ac.za','masters','research','North West','verified',
 null,'https://health-sciences.nwu.ac.za/psychology',null,current_date,false),
('nwu-masters-educational','North-West University','https://www.nwu.ac.za','masters','educational','North West','verified',
 null,'https://health-sciences.nwu.ac.za/psychology',null,current_date,false);

commit;

-- Sanity: counts by stream (run manually to verify)
-- select stream, count(*) from public.programmes where qualification='masters' group by stream order by stream;
