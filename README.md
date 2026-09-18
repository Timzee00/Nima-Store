# NIMA COLLECTION

A polished mini-storefront for NIMA COLLECTION, built with Next.js, Neon PostgreSQL and Vercel Blob.

## Run it

Copy `.env.example` to `.env.local`, fill in the secrets, run the SQL files in `lib/schema.sql` and `lib/seed.sql` against Neon, then run `npm install` and `npm run dev`.

## Production

Set the same environment variables in Vercel. Connect a Vercel Blob store for the admin image uploader. Never commit `.env.local` or real credentials.

## Hero film

The home hero already uses scroll-scrubbing: scroll position controls the video timeline. Put the final NIMA product film at `public/hero.mp4`.

The included poster keeps the hero polished until the final product footage is supplied.