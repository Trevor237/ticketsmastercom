## Plan

Promouvoir le compte existant `trevorkamael@gmail.com` (user id `f6bfe36d-0597-48b6-bc0a-f881f8569b9a`) au rôle `admin`.

### Étapes

1. Migration SQL pour insérer une ligne dans `public.user_roles`:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('f6bfe36d-0597-48b6-bc0a-f881f8569b9a', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

2. Après application: te connecter avec `trevorkamael@gmail.com` (mot de passe déjà défini lors de la création du compte) puis aller sur `/admin`.

### Identifiants
- **Email**: trevorkamael@gmail.com
- **Mot de passe**: celui que tu as choisi lors de l'inscription (je n'y ai pas accès — utilise "Mot de passe oublié" sur `/auth` si besoin).
