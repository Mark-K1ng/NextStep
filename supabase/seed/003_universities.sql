-- Seed data for universities with verified sources
-- Sources: admitere.edu.ro, official university websites

INSERT INTO universities (name, city, website, source_url, verified_at) VALUES
('Universitatea din București', 'București', 'https://www.unibuc.ro', 'https://www.unibuc.ro', NOW()),
('Universitatea Politehnica din București', 'București', 'https://www.pub.ro', 'https://www.pub.ro', NOW()),
('Universitatea de Medicină și Farmacie „Carol Davila”', 'București', 'https://www.umfcd.ro', 'https://www.umfcd.ro', NOW()),
('Universitatea Babeș-Bolyai', 'Cluj-Napoca', 'https://www.ubbcluj.ro', 'https://www.ubbcluj.ro', NOW()),
('Universitatea de Medicină și Farmacie Cluj-Napoca', 'Cluj-Napoca', 'https://www.umfcluj.ro', 'https://www.umfcluj.ro', NOW()),
('Universitatea Tehnică din Cluj-Napoca', 'Cluj-Napoca', 'https://www.utcluj.ro', 'https://www.utcluj.ro', NOW()),
('Universitatea „Alexandru Ioan Cuza”', 'Iași', 'https://www.uaic.ro', 'https://www.uaic.ro', NOW()),
('Universitatea de Medicină și Farmacie „Grigore T. Popa”', 'Iași', 'https://www.umfiasi.ro', 'https://www.umfiasi.ro', NOW()),
('Universitatea Tehnică „Gheorghe Asachi”', 'Iași', 'https://www.tuiasi.ro', 'https://www.tuiasi.ro', NOW()),
('Universitatea din Craiova', 'Craiova', 'https://www.ucv.ro', 'https://www.ucv.ro', NOW()),
('Universitatea Ovidius din Constanța', 'Constanța', 'https://www.univ-ovidius.ro', 'https://www.univ-ovidius.ro', NOW()),
('Universitatea de Vest din Timișoara', 'Timișoara', 'https://www.uvt.ro', 'https://www.uvt.ro', NOW()),
('Universitatea Politehnica din Timișoara', 'Timișoara', 'https://www.upt.ro', 'https://www.upt.ro', NOW()),
('Universitatea de Medicină și Farmacie din Timișoara', 'Timișoara', 'https://www.umft.ro', 'https://www.umft.ro', NOW()),
('Academia de Studii Economice din București', 'București', 'https://www.ase.ro', 'https://www.ase.ro', NOW());
