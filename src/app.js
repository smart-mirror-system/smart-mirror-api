const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const ratelimit = require('express-rate-limit');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const meRoutes = require('./routes/me.routes');
const sessionsRoutes = require('./routes/sessions.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const userRoutes = require('./routes/user.routes');
const faceRoutes = require('./routes/face.routes');

const { notFound, errorHandler } = require('./middleware/error');
const { loadEnv } = require('./config/env');

loadEnv();

const app = express();
const globalLimiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.REQUEST_LIMIT) || 100,
  message: {
    ok: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

app.use(cors());
app.use(morgan('dev'));
app.use(globalLimiter);
app.use(express.json());
/**
 * Health and readiness routes.
 * Exposed for Kubernetes probes and monitoring.
 */
app.use('/', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/face', faceRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
