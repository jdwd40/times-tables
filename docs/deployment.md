# Deployment — Times Tables

## Current disposition

Live deployment was intentionally skipped for this run.

- `jdwd40.com` resolves to `213.165.91.221`, a separate nginx host.
- `https://jdwd40.com/times-tables` currently serves the existing portfolio SPA fallback, so replacing it without host access could damage an unrelated site.
- SSH to `jdwd40.com` timed out from the build host.
- The local Hermes edge proxy is unrelated to the domain DNS and currently serves Robot Factory on its own port.

The app is complete and verified locally. The implementation branch is pushed and available in PR #1.

## Exact safe deployment steps

Run these steps on the existing nginx host after obtaining authorized access:

1. Fetch the repository and check out the reviewed commit:

   ```sh
   git clone https://github.com/jdwd40/times-tables.git
   cd times-tables
   git fetch origin factory/20260922-171410-53e87e-times-tables
   git checkout 4319c3f3070f62bcc5cedc8c4984ca739c22daee
   ```

2. Copy the static site to an isolated document root. Do not replace the existing portfolio root:

   ```sh
   sudo install -d -m 0755 /var/www/jdwd40-times-tables
   sudo cp index.html styles.css /var/www/jdwd40-times-tables/
   sudo cp -r src /var/www/jdwd40-times-tables/
   sudo chown -R root:root /var/www/jdwd40-times-tables
   ```

3. Add an nginx location inside the existing `jdwd40.com` TLS server block. Preserve the existing `/` location:

   ```nginx
   location = /times-tables {
       return 301 /times-tables/;
   }

   location /times-tables/ {
       alias /var/www/jdwd40-times-tables/;
       index index.html;
       try_files $uri $uri/ /times-tables/index.html;
   }
   ```

   If the host uses a separate `root`/`try_files` convention, adapt only this isolated prefix. Do not change the portfolio root or unrelated proxy locations.

4. Validate and reload nginx:

   ```sh
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. Verify the exact path in a real browser and check the console:

   - `https://jdwd40.com/times-tables/`
   - 390×844: keypad, equation/stats, grid scrolling, and first-digit timer
   - 1280×800: keypad does not cover the grid
   - complete a run: leaderboard row, best time, mute persistence and completion state

6. Roll back safely by removing only the two `/times-tables` locations and reloading nginx. Leave `/var/www/jdwd40-times-tables` in place until the rollback is verified.
