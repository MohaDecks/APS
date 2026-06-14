import bcrypt from 'bcryptjs';
import { connectDB } from './db/connect.js';
import User from './models/User.js';
import Settings from './models/Settings.js';

await connectDB();

const adminExists = await User.findOne({ role: 'admin' });
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  await User.create({ email: 'admin@parking.com', password: hash, name: 'Admin', role: 'admin' });
  console.log('Default admin created: admin@parking.com / admin123');
}

const operatorExists = await User.findOne({ email: 'operator@parking.com' });
if (!operatorExists) {
  const hash = bcrypt.hashSync('operator123', 10);
  await User.create({
    email: 'operator@parking.com',
    password: hash,
    name: 'Parking Operator',
    role: 'operator',
  });
  console.log('Default operator created: operator@parking.com / operator123');
}

const settingsExists = await Settings.findOne();
if (!settingsExists) {
  await Settings.create({
    hourly_rate: 50,
    facility_name: 'Bole International Airport Parking',
  });
  console.log('Default settings created');
}

console.log('Seed complete.');
process.exit(0);
