import fs from 'fs';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db/connect.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import parkingRoutes from './routes/parking.js';
import invoicesRoutes from './routes/invoices.js';
import reportsRoutes from './routes/reports.js';
import paymentMethodsRoutes from './routes/paymentMethods.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load backend/.env (PM2 also injects these via ecosystem.config.cjs)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvFile(path.join(__dirname, '../.env'));
loadEnvFile(path.join(__dirname, '../../.env'));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '12mb' }));

app.use('/api/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'mongodb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

await connectDB();

// Bootstrap: if no admin has payment/price flags yet, grant all admins both
try {
  const { default: User } = await import('./models/User.js');
  const hasPaymentsAdmin = await User.exists({ role: 'admin', can_update_payments: true });
  const hasPriceAdmin = await User.exists({ role: 'admin', can_update_price: true });
  if (!hasPaymentsAdmin || !hasPriceAdmin) {
    const update = {};
    if (!hasPaymentsAdmin) update.can_update_payments = true;
    if (!hasPriceAdmin) update.can_update_price = true;
    const result = await User.updateMany({ role: 'admin' }, { $set: update });
    if (result.modifiedCount) {
      console.log(`Granted admin permissions to ${result.modifiedCount} admin(s)`);
    }
  }
} catch (e) {
  console.warn('Permission bootstrap skipped:', e.message);
}

try {
  const { default: Settings } = await import('./models/Settings.js');
  const renamed = await Settings.updateMany(
    { facility_name: { $in: ['Dirsh Parking', 'Dirsha Parking', 'Dirsh', 'Bildhan Parking'] } },
    { $set: { facility_name: 'Bildhaan Parking' } },
  );
  if (renamed.modifiedCount) {
    console.log(`Renamed facility to Bildhaan Parking (${renamed.modifiedCount})`);
  }
} catch (e) {
  console.warn('Facility name bootstrap skipped:', e.message);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Airport Parking API running on http://0.0.0.0:${PORT}`);
});
