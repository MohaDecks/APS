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
| **Operator App** | http://localhost:8082/login |

> **Admin iyo Operator** port kala duwan ayay ku yaallaan — hal browser labadood isku ma dhacaan (token conflict ma jiro).

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

Mobile app-ka waxaa loo isticmaali karaa **browser** oo la **install** gareyn karo (Android, iPhone, Desktop).

Production: **https://app.bildhaan.dirshay.com** (HTTPS waa qasab si install u shaqeeyo).

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

Web-ka API wuxuu automatic u isticmaalaa isla origin-ka (production: `https://app.bildhaan.dirshay.com`). Hubi backend inuu socdo.

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
| GET/POST/PUT/DELETE | `/api/payment-methods` | Payment methods (admin) |
| GET | `/api/payment-methods/active` | Active payment methods (operator) |

## Fee Calculation

Lacagta waxaa loo xisaabiyaa saacad kasta oo la bilaabay:
- 1 daqiiqo = 1 saacad = ETB 50
- 1 saacad 5 daqiiqo = 2 saacadood = ETB 100
- 3 saacadood = ETB 150

Admin wuxuu beddeli karaa qiimaha saacaddii Settings → Hourly rate.

## Server Deploy (PM2 + Nginx — HTTPS subdomains)

Server-ka: **PM2** backend, **Nginx** admin + operator static files.

| Wax | URL |
|-----|-----|
| **Operator app (PWA)** | https://app.bildhaan.dirshay.com |
| **Admin** | https://bildhaan.admin.dirshay.com |
| **API** | https://app.bildhaan.dirshay.com/api/health |

### 1. `.env` server-ka (`/var/www/html/APS/.env`)

```env
JWT_SECRET=password-random-ah-oo-dheer
MONGODB_URI=mongodb://127.0.0.1:27017/airport_parking
PORT=3001
```

### 2. Build + PM2

```bash
cd /var/www/html/APS
git pull
npm run install:all
sudo PM2_CMD="sudo pm2" npm run deploy
sudo pm2 list
```

Waa in aad aragto **`aps-api`**.

### 3. Nginx + HTTPS

DNS: laba **A** record → server IP:

- `app.bildhaan.dirshay.com`
- `bildhaan.admin.dirshay.com`

```bash
cd /var/www/html/APS
sudo cp deploy/nginx/app.bildhaan.dirshay.com.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/bildhaan.admin.dirshay.com.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/app.bildhaan.dirshay.com.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/bildhaan.admin.dirshay.com.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d app.bildhaan.dirshay.com -d bildhaan.admin.dirshay.com
```

### 4. URLs

| Wax | URL | Login |
|-----|-----|-------|
| **Admin** | https://bildhaan.admin.dirshay.com/login | `admin@parking.com` |
| **Operator** | https://app.bildhaan.dirshay.com/login | `operator@parking.com` |
| **API** | https://app.bildhaan.dirshay.com/api/health | — |

App-ka (Chrome/Android) → banner **Install**, ama menu → **Install app**. iPhone: Share → **Add to Home Screen**.

Default login (haddii users DB-ga ku jiraan):
- Admin: `admin@parking.com` / `admin123`
- Operator: `operator@parking.com` / `operator123`

### 5. Update marka code cusub la keeno

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

### Architecture

```
Admin     → https://bildhaan.admin.dirshay.com  → deploy/dist/admin
Operator  → https://app.bildhaan.dirshay.com    → deploy/dist/operator
API       → /api/ on both                      → PM2 aps-api (:3001) → MongoDB
```
