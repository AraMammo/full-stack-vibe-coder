import express from 'express';
import cors from 'cors';
import path from 'path';
import { router as videoRoutes } from './routes/video';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ffmpeg-worker' });
});

// Serve static files for local development
// In production, files are served from S3
const localStoragePath = process.env.LOCAL_STORAGE_PATH || '/tmp/ffmpeg-worker/output';
app.use('/files', express.static(localStoragePath));

// Video processing routes
app.use('/api/video', videoRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`FFMPEG Worker running on port ${PORT}`);
});
