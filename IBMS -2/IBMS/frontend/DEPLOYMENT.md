## Netlify deployment

The root `netlify.toml` installs and builds this frontend and deploys the API in this directory's `netlify/functions` folder. `/api/*` routes to that API before the React Router fallback.

The deployed app uses Netlify Identity for accounts and Netlify Database for billing records. Database migrations are generated from `db/schema.ts` and applied automatically during deployment. Do not run the old MongoDB seeder against this deployment.

After deployment, choose **Create new account**, register with your own email address, and open the confirmation link in your inbox. Set your business details under **Settings**, then add customers and products before creating invoices. The former demo login was a local development fixture; existing MongoDB accounts and records are not automatically imported.

The API verifies the current Identity session and scopes every record to its owner. Payments and invoice updates run in a database transaction. The browser uses the same-origin `/api` endpoint, so a separate backend host or `VITE_API_URL` is no longer required.

For focused checks without producing build artifacts:

```sh
node --experimental-transform-types --test server/billing.test.ts
npx tsc --noEmit --module nodenext --moduleResolution nodenext --target es2022 --skipLibCheck --allowJs --types node netlify/functions/api.mts server/billing.ts db/schema.ts db/index.ts drizzle.config.ts
```
