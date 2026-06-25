const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');
const sessionsRoutes = require('./routes/sessions.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const userRoutes = require('./routes/user.routes');
const faceRoutes = require('./routes/face.routes');
const { loadEnv } = require('./config/env');

loadEnv();

const app = express();

app.set('trust proxy', 1); // Trust first proxy for rate limiting behind proxies/load balancers
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(globalLimiter);
app.use(express.json({ limit: '50kb' }));
app.use(xss());

app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/face', faceRoutes);

// NOTE: notFound / errorHandler middleware and aisocket routes (/api/ai)
// are registered in server.js (not here) because they depend on `req.io`,
// which is injected via middleware after the Socket.IO server is created.
// See server.js lines ~41-48.

module.exports = app;
