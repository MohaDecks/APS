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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Airport Parking API running on http://0.0.0.0:${PORT}`);
});
