# Airport Parking System

Nidaamka maamulka baabuurta ee garoonka diyaaradaha — React Native mobile app + Admin web portal.

## Qaybaha (Components)

| Qayb | Technology | Role |
|------|-----------|------|
| **Backend API** | Node.js + Express + MongoDB | Port 3001 |
| **Mobile App / PWA** | React Native (Expo) | Operator — check-in/out only |
| **Admin Portal** | React + Vite + Tailwind | Admin — view only + users + pricing |

## Features

### Mobile App (Operator)
- Check-in / Check-out baabuurta
- Lacagta iyo waqtiga toos ah
- Invoice marka check-out la sameeyo

### Admin Portal (View + Manage)
- **Live View** — Arag baabuurta hadda jira (read-only)
- **Departed** — Baabuurta baxday / history
- **Reports** — Daily, weekly, monthly revenue
- **Invoices** — Arag rasiidhada
- **Users** — Abuur operator accounts (mobile app)
- **Pricing** — Qiimaha saacaddii (ETB/hr) iyo magaca facility

## Setup

### 1. Install MongoDB

Hubi in MongoDB uu socdo:

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ama Docker
docker run -d -p 27017:27017 --name parking-mongo mongo:7
```

### 2. Install (hal mar)

Root folder-ka mashruuca:

```bash
cd /Volumes/O/APS
npm run install:all
```

### 3. Start (hal amar — wax walba wada)

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| **Backend API** | http://localhost:3001 |
| **Admin Portal** | http://localhost:5180/login |
| **Mobile / PWA** | http://localhost:8082/login |

> **Muhiim:** Ku orod **root folder-ka** `APS` — hal amar ayaa backend + admin + mobile wada bilaaba.

Jooji dhammaan:

```bash
npm run stop
```

### Start individually (optional)

```bash
npm run backend    # API only
npm run admin      # Admin portal only
npm run mobile:web # Mobile browser only
```

### 4. Start admin portal (old)

```bash
npm run admin
```

Fur browser: http://localhost:5180/login

### 6. Start mobile app (Expo Go / emulator)

```bash
npm run mobile
```

Scan QR code with Expo Go, ama run on Android emulator.

## PWA — Web Installable App

Mobile app-ka waxaa sidoo kale loo isticmaali karaa **browser** oo la **install** gareyn karo (Android, iPhone, Desktop).

### Development (browser)

```bash
npm run mobile:web
```

Fur: http://localhost:8081

### Production build

```bash
npm run mobile:build
```

Output: `mobile/dist/` — deploy to any static host (Netlify, Vercel, Nginx).

### Install on devices

| Platform | Sida loo install gareeyo |
|----------|-------------------------|
| **Android Chrome** | Menu → "Install app" ama banner-ka "Install" |
| **iPhone Safari** | Share → "Add to Home Screen" |
| **Desktop Chrome/Edge** | Address bar → Install icon |

### PWA Features

- `manifest.json` — app name, icons, theme
- `sw.js` — service worker (offline shell + cache)
- `offline.html` — offline fallback page
- Responsive design — mobile-first, max 480px on desktop
- Install prompt banner — Android auto-prompt, iOS instructions

### API URL (Web)

Web-ka API wuxuu automatic u isticmaalaa `http://<hostname>:3001`. Hubi backend inuu socdo.

## Mobile App — APK Build

### Option A: EAS Build (cloud)

```bash
cd mobile
npx eas-cli login
npx eas build --platform android --profile preview
```

### Option B: Local build

```bash
cd mobile
npx expo prebuild
cd android && ./gradlew assembleRelease
```

APK: `mobile/android/app/build/outputs/apk/release/app-release.apk`

### API URL for real device

Edit `mobile/app.json` → `extra.apiUrl` to your server IP:

```json
"extra": {
  "apiUrl": "http://192.168.1.100:3001"
}
```

For Android emulator, use `http://10.0.2.2:3001`.

## MongoDB Configuration

Default connection: `mongodb://127.0.0.1:27017/airport_parking`

To use a custom URI, create `backend/.env`:

```bash
nano backend/.env
```

```env
MONGODB_URI=mongodb://127.0.0.1:27017/airport_parking
```

For MongoDB Atlas (cloud), set `MONGODB_URI` to your Atlas connection string.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/parking/stats` | Dashboard stats |
| GET | `/api/parking/active` | Active sessions |
| POST | `/api/parking/check-in` | Check in vehicle |
| POST | `/api/parking/check-out/:id` | Check out + generate invoice |
| GET | `/api/parking/history` | Session history |
| GET | `/api/invoices` | List invoices |
| GET | `/api/reports/:period` | daily/weekly/monthly reports |
| GET/PUT | `/api/settings` | Parking settings |
| GET/POST/DELETE | `/api/users` | User management (admin) |

## Fee Calculation

Lacagta waxaa loo xisaabiyaa saacad kasta oo la bilaabay:
- 1 daqiiqo = 1 saacad = ETB 50
- 1 saacad 5 daqiiqo = 2 saacadood = ETB 100
- 3 saacadood = ETB 150

Admin wuxuu beddeli karaa qiimaha saacaddii Settings → Hourly rate.

## Server Deploy (PM2 + Nginx)

Isticmaal haddii aad hore u leedahay **PM2 apps** (`deknest`, `insurance-api`, iwm.) oo aad rabto **aps-api** in uu ku muuqdo `pm2 list`.

### 1. `.env` server-ka

```env
JWT_SECRET=password-random-ah-oo-dheer
MONGODB_URI=mongodb://127.0.0.1:27017/airport_parking
PORT=3001
```

### 2. Deploy PM2

```bash
cd /var/www/html/APS
git pull
npm run install:all
sudo PM2_CMD="sudo pm2" npm run pm2:start
sudo pm2 list
```

Waa in aad aragto **`aps-api`** liiska.

### 3. Nginx (port 80)

```bash
sudo cp deploy/nginx-host.conf /etc/nginx/sites-available/aps
sudo nano /etc/nginx/sites-available/aps   # beddel server_name + paths
sudo ln -sf /etc/nginx/sites-available/aps /etc/nginx/sites-enabled/aps
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Update marka code cusub la keeno

```bash
cd /var/www/html/APS
git pull
sudo PM2_CMD="sudo pm2" npm run pm2:restart
```

### PM2 commands

```bash
sudo pm2 list
sudo pm2 logs aps-api
sudo pm2 restart aps-api
npm run pm2:stop
```

> **Docker vs PM2:** Dooro mid — ha orodinin labadaba backend isku mar. PM2: `docker compose stop backend web`. Docker: `npm run pm2:stop`.

## Subdomain — parking.dirshay.com

[dirshay.com](http://dirshay.com/) wuxuu hore u hayaa SafeFare. APS waxaa lagu riday **subdomain** gaar ah:

| Wax | URL |
|-----|-----|
| **Admin** | http://parking.dirshay.com/login |
| **Operator (mobile/PWA)** | http://parking.dirshay.com/m/login |
| **API** | http://parking.dirshay.com/api/health |

### 1. DNS (domain registrar-ka dirshay.com)

| Type | Name | Value |
|------|------|-------|
| **A** | `parking` | `2.58.82.168` (IP server-kaaga) |

Sug 5–30 daqiiqo si DNS u faafo.

### 2. Server `.env` (Docker — isku mid)

```env
JWT_SECRET=password-random-ah-oo-dheer
HTTP_PORT=8080
```

### 3. Docker bilow

```bash
cd /var/www/html/APS
git pull
docker compose up -d --build
curl http://localhost:8080/api/health
```

### 4. Nginx subdomain (port 80 → Docker 8080)

```bash
sudo cp deploy/nginx-parking.dirshay.com.conf /etc/nginx/sites-available/parking.dirshay.com
sudo ln -sf /etc/nginx/sites-available/parking.dirshay.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. HTTPS (recommended)

```bash
sudo certbot --nginx -d parking.dirshay.com
```

Kadib isticmaal `https://parking.dirshay.com/m/login`

> **dirshay.com** (SafeFare) iyo **parking.dirshay.com** (APS) way kala madax banaan yihiin — ma isku dhacaan.

## Server Deploy (Docker)

Ku shub server-ka (VPS) — hal amar, wax walba waa isku socdaan.

### Shuruudaha server-ka

- **Ubuntu 22+** ama Debian (VPS: DigitalOcean, Hetzner, AWS, etc.)
- **Docker** + **Docker Compose** installed
- Port **80** furan (HTTP)

### 1. Upload project to server

```bash
# On your Mac — copy to server (beddel IP-ga)
scp -r /Volumes/O/Parking user@YOUR_SERVER_IP:/opt/parking

# SSH into server
ssh user@YOUR_SERVER_IP
cd /opt/parking
```

Ama isticmaal `git clone` haddii repo GitHub ku jiro.

### 2. Configure environment

```bash
nano .env
```

**Muhiim:** Beddel `JWT_SECRET` — password random ah oo dheer.

### 3. Deploy

```bash
npm run deploy
```

Ama manually:

```bash
docker compose up -d --build
docker compose --profile seed run --rm seed
```

### 4. Fur browser-ka

| Service | URL |
|---------|-----|
| **Admin Portal** | `http://YOUR_SERVER_IP/` |
| **Mobile / PWA** | `http://YOUR_SERVER_IP/m/` |
| **API Health** | `http://YOUR_SERVER_IP/api/health` |

Default login:
- Admin: `admin@parking.com` / `admin123`
- Operator (mobile): `operator@parking.com` / `operator123`

### Useful commands

```bash
npm run deploy:logs    # View logs
npm run deploy:down    # Stop all
npm run deploy:seed    # Re-seed users
docker compose restart backend
```

### HTTPS (optional)

Install **Caddy** or **Certbot** in front of port 80, ama isticmaal Cloudflare proxy.

### Native APK (points to your server)

Marka APK build gareyso, ku dar server IP:

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://YOUR_SERVER_IP npx eas build --platform android --profile preview
```

### Architecture

```
Internet → Nginx (:80)
            ├── /        → Admin (React)
            ├── /m/      → Mobile PWA
            └── /api/    → Backend (Node.js :3001)
                              └── MongoDB
```
