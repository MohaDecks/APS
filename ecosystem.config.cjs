const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const root = __dirname;
const env = loadEnv(path.join(root, '.env'));

module.exports = {
  apps: [
    {
      name: 'aps-api',
      cwd: path.join(root, 'backend'),
      script: 'src/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: env.PORT || '3001',
        MONGODB_URI: env.MONGODB_URI || 'mongodb://127.0.0.1:27017/airport_parking',
        JWT_SECRET: env.JWT_SECRET || 'change-me-in-production',
      },
    },
  ],
};
