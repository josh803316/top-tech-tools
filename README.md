# Top Tech Tools

An automatically refreshed catalog and trending feed for developer tools. The
site combines repository metrics with launch and community signals, while using
strict filters before automatically publishing newly discovered entries.

## Data sources

- GitHub repository metadata and topic-based discovery (`GITHUB_TOKEN`)
- Homebrew formula metadata and 30-day install analytics (public API)
- Product Hunt launches (`PRODUCT_HUNT_TOKEN`, optional free developer token)
- Hacker News stories (public Algolia API)
- Reddit developer communities (public JSON listings)
- Lobsters' hottest programming stories (public JSON feed; direct GitHub links only)

Sources fail independently, so an unavailable optional feed does not prevent
the remaining metrics from updating. A refresh containing recorded processing
errors returns HTTP 207, which makes the GitHub monitor fail visibly instead of
reporting a false green.

## Background refresh

Production refreshes twice daily:

- 06:00 UTC through `.github/workflows/daily-refresh.yml`
- 18:00 UTC through Vercel Cron in `vercel.json`

Both call the authenticated `/api/refresh` endpoint. The GitHub workflow rejects
overlapping runs, retries transient transport failures, and requires the response
to be a complete HTTP 200. `CRON_SECRET` is required; the endpoint fails closed
when it is missing.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Checks

```bash
npm run test
npm run typecheck
npm run build
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
