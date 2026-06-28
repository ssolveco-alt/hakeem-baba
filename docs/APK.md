# Turning HakeemCare into an Android APK

HakeemCare is a server-rendered web app (Next.js + Supabase), so the app itself
runs online. The APK is a thin native wrapper that opens your hosted app
full-screen, with no browser bars — it looks and feels like a normal Android app.

The app is already a installable **PWA** (manifest, icons, service worker, theme
color all set up). You just need to (1) put it online and (2) generate the APK.

---

## Step 1 — Deploy to a public HTTPS URL (Vercel, free)

1. Push this project to a GitHub repo.
2. Go to https://vercel.com → **Add New → Project** → import the repo.
3. In **Environment Variables**, add the three from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy**. You'll get a URL like `https://hakeemcare.vercel.app`.

> CLI alternative: `npm i -g vercel` then `vercel` (follow the prompts), and add
> the env vars with `vercel env add ...`.

Open the URL on your phone's Chrome → menu **⋮ → Add to Home screen**. It already
installs as an app. The APK below just makes that official + distributable.

---

## Step 2 — Generate the APK (no Android tools needed)

Use **PWABuilder** (Microsoft, free):

1. Go to https://www.pwabuilder.com
2. Paste your Vercel URL → **Start**.
3. It scores your PWA (manifest + service worker + icons are already in place).
4. Click **Package For Stores → Android**.
5. Choose **Signed APK** (for direct install) or **AAB** (for Google Play).
6. Download the `.zip`. It contains:
   - `app-release-signed.apk` ← send this to phones to install.
   - `assetlinks.json` ← needed to remove the address bar (Step 3).
   - `signing.keystore` + passwords ← **keep these safe**, you need them for every future update.

To install on a phone: copy the `.apk` to the device and open it (enable
"Install unknown apps" for your file manager when prompted).

---

## Step 3 — (Optional) Remove the URL bar / verify the app

PWABuilder's APK is a "Trusted Web Activity". To hide the address bar, Android
must verify your site owns the app:

1. From the PWABuilder zip, open `assetlinks.json`.
2. Put it in this project at `public/.well-known/assetlinks.json`.
3. Redeploy. It must be reachable at
   `https://YOUR-URL/.well-known/assetlinks.json`.

(If you skip this, the app still works — it just shows a thin URL bar.)

---

## Updating the app later

1. Push changes → Vercel auto-redeploys → the APK shows the new version instantly
   (it loads your live site; no need to rebuild the APK for content/UI changes).
2. Only rebuild the APK (reusing the **same keystore**) if you change the app
   name, icon, or package id.

---

## Native-app alternative (Capacitor)

If you later want a true native build (push notifications, app-store presence,
deeper device APIs), wrap it with [Capacitor](https://capacitorjs.com) pointing
`server.url` at your Vercel URL, then build with Android Studio. This needs the
Android SDK installed locally. PWABuilder is simpler for now.
