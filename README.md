# Realtime Events Hub

IMPORTANT — This platform must be 100% dynamic.

ALL content displayed on the public site must come

from the Supabase database in real time.

Nothing should be hardcoded in the frontend.

This includes:

- Event titles, descriptions, dates, cities, venues

- Event images (stored in Supabase Storage)

- Ticket types, prices, available quantities

- Featured events (toggled by admin)

- Event status (published / draft / cancelled)

- Service fee percentage (set in admin settings)

- Platform name and tagline

- Promo codes and discount values

- Categories available for filtering

The admin panel is the SINGLE SOURCE OF TRUTH.

Any change made in the admin panel must reflect

immediately on the public site without any

code deployment or page reload (use real-time

Supabase subscriptions where needed).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://ticketsmastercom.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/125668fe-8cb5-4d1d-9eba-6826d7b8d6db).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
