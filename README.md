# To start development run the following command:
npm start

# To build production files:
npm run build

Use `sudo` to host HTTP(s) server at port 443 (required only while in the dev mode)

---

 - `src/` - application source folder
 - `dist/` - folder with compiled files (always rebuilded by the gulp)

---

### Структура проекта:

 - `src/assets/` - contains SASS files, icons, images and local fonts
 - `src/app/components/` - contains application code (html templates, controllers, services)
 - `src/app/shared/` - contains our own directives used in the app
 - `src/app/vendor/` - contains some third party libraries and directives

 - `src/app/app.js` - main application file (builds to `bundle.js`)
 - `src/app/app.config.js` - main application configuration file
 - `src/app/app.routes.js` - routes configuration files (all routes are only here)
 - `src/app/app.vendor.js` - list of vendor dependencies (builds to `vendor.js`)

---

#### Chrome extension to show app structure:

https://chrome.google.com/webstore/detail/-/gghbihjmlhobaiedlbhcaellinkmlogj

---