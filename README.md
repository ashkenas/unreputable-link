# Unreputable Link
A lightweight URL lengthener with concerningly unreputable recommendations. [Try it out!](https://unreputable.link/)

## Can I run my own version?
Sure. I don't know why you'd want to, but sure.

### Dependencies
- A somewhat modern version of [Node.js](https://nodejs.org/en/download/package-manager/current) (just use the latest like a sane person)
- A [Supabase](https://supabase.com/) project with a table named `links` with the following schema:
  - `id` - int8 primary key
  - `mask` - text not null
  - `actual` - text not null
  - `hits` - int8 not null default 0

### Installation
1. Clone this repository
2. Create a `.env` file at the repository root and add the following variables:
  - `SUPABASE_URL` - The Project URL for your Supabase project
  - `SUPABASE_ROLE_KEY` - The Service Role API Key for your project
  - `HOST` - The host where this server is accessible
3. Run `npm start` in the repository root
