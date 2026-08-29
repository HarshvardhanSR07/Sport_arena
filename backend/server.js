const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');
const cronJobs = require('./services/cronJobs');
const WebSocketService = require('./services/websocketService');

dotenv.config();

const app = express();
const server = http.createServer(app);

connectDB();

const frontendOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : frontendOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
  });
}

// Mount every route module through one loop so a bad export fails loudly
// with the exact file name instead of Express's generic Router.use() error.
const routeModules = [
  ['/api/auth', './routes/auth'],
  ['/api/facilities', './routes/facilities'],
  ['/api/bookings', './routes/bookings'],
  ['/api/users', './routes/users'],
  ['/api/analytics', './routes/analytics'],
  ['/api/challenger', './routes/challenger'],
  ['/api/checkin', './routes/checkin'],
  ['/api/health', './routes/health'],
];

for (const [mountPath, modulePath] of routeModules) {
  const router = require(modulePath);

  if (typeof router !== 'function') {
    // Most common cause: the route file does `module.exports = { router }`
    // (or exports some other object) instead of `module.exports = router;`
    throw new Error(
      `Route module "${modulePath}" (mounted at "${mountPath}") did not export ` +
      `an Express router/middleware function — got "${typeof router}" instead. ` +
      `Open that file and make sure it ends with: module.exports = router;`
    );
  }

  app.use(mountPath, router);
}

app.get('/api/health-check', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'IITG Arena Hub API'
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

cronJobs.initCronJobs();
WebSocketService.initialize(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 WebSocket server ready`);
});