import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/errorHandler.middleware';
import studentRoutes from "./routes/student.routes";
import adminRoutes from "./routes/admin.routes";
import superadminRoutes from './routes/superadmin.routes';
import { startSyncJob } from './jobs/sync.job';

dotenv.config();

// Swagger UI Integration
// Load OpenAPI YAML specification
const openApiSpec = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use("/api/students", studentRoutes);
app.use('/api/admin', adminRoutes);              // Teacher & Intern & admin
app.use('/api/superadmin',superadminRoutes);    // Superadmin ONLY

// Swagger UI Documentation Route
// Developers can test all APIs interactively at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DSA Tracker API Documentation'
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize cron jobs for leaderboard optimization
startSyncJob();

export default app;