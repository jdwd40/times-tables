# Deployment — Times Tables

## Current disposition

Deployed and verified at:

`https://jdwd40.com/times-tables/`

The static app is isolated at `/var/www/jdwd40.com/html/times-tables` and nginx
has dedicated exact/prefix locations in the existing `jdwd40.com` TLS vhost.
The portfolio root and unrelated locations were preserved.

Deployment commit: `7ef8a53`.

Verified live: redirect to the trailing-slash path, HTML/CSS/module responses,
144 cells, keypad input, physical keyboard progression, mute persistence after
reload, and unchanged `https://jdwd40.com/` portfolio response.

## Exact safe deployment steps

The deployment that was performed used these steps on the existing nginx host:

1. Fetch the repository and check out the reviewed commit:

   ```sh
   git clone https://github.com/jdwd40/times-tables.git
   cd times-tables
   git fetch origin factory/20260922-171410-53e87e-times-tables
   git checkout 7ef8a533ba7a1267811a7cfea4e3a7d13ca5e4d1
   ```

2. Copy the static site to an isolated document root. Do not replace the existing portfolio root:

   ```sh
   sudo install -d -m 0755 /var/www/jdwd40.com/html/times-tables
   sudo cp index.html styles.css /var/www/jdwd40.com/html/times-tables/
   sudo cp -r src /var/www/jdwd40.com/html/times-tables/
   sudo chown -R root:root /var/www/jdwd40.com/html/times-tables
   ```

3. Add an nginx location inside the existing `jdwd40.com` TLS server block. Preserve the existing `/` location:

   ```nginx
   location = /times-tables {
       return 301 /times-tables/;
   }

   location /times-tables/ {
       alias /var/www/jdwd40.com/html/times-tables/;
       index index.html;
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

6. Roll back safely by restoring `/etc/nginx/sites-enabled/jdwd40.com.before-times-tables-7ef8a53`, removing only the `/times-tables` snippet/include, and reloading nginx. The deployed document root can remain in place until rollback is verified.
