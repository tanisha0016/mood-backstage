import express from 'express';
import { LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';

interface RouterOptions {
  logger: LoggerService;
  config: Config;
}

export async function createRouter(options: RouterOptions): Promise<express.Router> {
  const { logger, config } = options;

  const router = express.Router();          // Main router
  const moodRouter = express.Router();      // Sub-router mounted at /mood-plugin

  // Middleware setup
  moodRouter.use(express.json({ limit: '1mb' }));
  moodRouter.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  moodRouter.use((req, _res, next) => {
    logger.info(`📝 ${req.method} ${req.originalUrl}`, {
      body: req.body,
      headers: req.headers,
    });
    next();
  });

  // Get Kafka producer URL from config or environment
  const getKafkaProducerUrl = () => {
    try {
      return config.getOptionalString('mood.kafkaProducerUrl')
        || process.env.KAFKA_PRODUCER_URL
        || 'http://127.0.0.1:61810/mood';
    } catch {
      return 'http://127.0.0.1:61810/mood';
    }
  };

  // Health check endpoint
  moodRouter.get('/health', (_req, res) => {
    const kafkaUrl = getKafkaProducerUrl();
    res.json({
      status: 'healthy',
      plugin: 'mood-plugin-backend',
      kafkaProducerUrl: kafkaUrl,
      timestamp: new Date().toISOString(),
    });
  });

  // Mood submission endpoint
  moodRouter.post('/submit', async (req, res) => {
    const { name, mood, timestamp } = req.body;

    logger.info('🎭 Received mood submission:', {
      name,
      mood,
      timestamp,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    if (!name || !mood || !timestamp) {
      logger.warn('❌ Validation failed:', { name, mood, timestamp });
      return res.status(400).json({
        error: 'Missing required fields: name, mood, timestamp',
        received: { name, mood, timestamp },
      });
    }

    const parsedTimestamp = new Date(timestamp);
    if (isNaN(parsedTimestamp.getTime())) {
      logger.warn('❌ Invalid timestamp format:', timestamp);
      return res.status(400).json({
        error: 'Invalid timestamp format. Use ISO 8601 format (e.g., 2025-06-23T13:00:00Z)',
        received: timestamp,
      });
    }

    const kafkaProducerUrl = getKafkaProducerUrl();
    const payload = { name, mood, timestamp };

    try {
      logger.info(`📤 Forwarding to Kafka producer at ${kafkaProducerUrl}/mood`);

      const fetch = (await import('node-fetch')).default;

      const response = await fetch(`${kafkaProducerUrl}/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Backstage-Mood-Plugin/1.0',
        },
        body: JSON.stringify(payload),
        timeout: 15000,
      });

      const responseData = await response.text();

      logger.info(`📥 Kafka producer response [${response.status}]:`, {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });

      return res.status(response.status)
        .set('Content-Type', response.headers.get('content-type') || 'application/json')
        .send(responseData);

    } catch (error: any) {
      logger.error('❌ Error communicating with Kafka producer:', {
        error: error.message,
        code: error.code,
        kafkaUrl: kafkaProducerUrl,
        payload,
      });

      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Kafka producer service unavailable',
          details: `Cannot connect to ${kafkaProducerUrl}/mood`,
          suggestion: 'Check if your Kafka producer is running and accessible',
        });
      }

      if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
        return res.status(504).json({
          error: 'Kafka producer timeout',
          details: 'Request to Kafka producer timed out after 15 seconds',
        });
      }

      return res.status(500).json({
        error: 'Failed to forward mood to Kafka producer',
        details: error.message,
        kafkaProducerUrl,
      });
    }
  });

  // Test endpoint for debug
  moodRouter.post('/test', (req, res) => {
    logger.info('🧪 Test endpoint called:', req.body);
    res.json({
      message: 'Test endpoint working',
      received: req.body,
      timestamp: new Date().toISOString(),
    });
  });

  // Mount sub-router at /mood-plugin
  router.use( '/mood-plugin',moodRouter);

  return router;
}
