# Deploying Sunny Harper Chat Widget

## Quick Deploy to Netlify (Easiest - Free)

1. Go to [netlify.com/drop](https://app.netlify.com/drop)
2. Drag the `dist/widget` folder onto the page
3. Wait for deploy (takes ~30 seconds)
4. Copy your URL (e.g., `https://sunny-abc123.netlify.app`)
5. Add to your website:

```html
<script src="https://YOUR-NETLIFY-URL.netlify.app/sunny-harper.iife.js"></script>
<script>
  SunnyHarper.init({
    lang: 'en',
    position: 'bottom-right',
    primaryColor: '#233dff'
  });
</script>
```

## For Webflow Specifically

1. Deploy to Netlify (above)
2. In Webflow, go to **Project Settings** → **Custom Code**
3. In the **Footer Code** section, paste:

```html
<script src="https://YOUR-NETLIFY-URL.netlify.app/sunny-harper.iife.js"></script>
<script>
  SunnyHarper.init({
    lang: 'en',
    position: 'bottom-right'
  });
</script>
```

4. Publish your Webflow site

## Configuration Options

```javascript
SunnyHarper.init({
  lang: 'en',              // 'en' or 'es'
  position: 'bottom-right', // 'bottom-right' or 'bottom-left'
  primaryColor: '#233dff',  // Your brand color (HMC blue)
  logoUrl: 'https://...',   // Custom logo (optional)
});
```

## Alternative: Cloudflare Pages (Also Free)

1. Push the `sunny-harper-chat` folder to a GitHub repo
2. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
3. Connect your GitHub repo
4. Build settings:
   - Build command: `npm run build:widget`
   - Output directory: `dist/widget`
5. Deploy

## Rebuilding After Changes

```bash
cd /Users/ericarobinson/Downloads/sunny-harper-chat
npm run build:widget
```

Then re-upload to Netlify or push to GitHub.
