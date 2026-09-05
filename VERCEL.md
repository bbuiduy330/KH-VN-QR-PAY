# Vercel deployment

The Vercel target is the root project with `apps/web` as its build output. The web app supports `VITE_DEMO_MODE=true`, so the demo can run without a live API or blockchain.

Build: `npm run build:web`
Output: `apps/web/dist`
Install: `npm install`

For the first demo set `VITE_DEMO_MODE=true`. For production set `VITE_DEMO_MODE=false` and provide `VITE_API_BASE_URL` pointing at the API service.

After deployment, set the HTTPS URL as the Telegram Mini App / Web App URL in BotFather.
