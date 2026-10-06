-- Marque neutre : le nom et le slogan restent modifiables dans l'admin (Paramètres).
ALTER TABLE public.settings ALTER COLUMN platform_name SET DEFAULT 'Billetterie Afrique';
UPDATE public.settings
SET platform_name = 'Billetterie Afrique'
WHERE id = 1 AND platform_name ILIKE 'tik%tmaster%';
