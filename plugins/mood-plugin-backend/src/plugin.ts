import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './services/TodoListService/router';

/**
 * Mood plugin for Backstage backend
 * Handles mood submissions and forwards them to Kafka producer
 */
export const moodPlugin = createBackendPlugin({
  pluginId: 'mood-plugin-backend',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async init({ httpRouter, logger, config }) {
        logger.info('🚀 Initializing mood plugin backend');

        try {
          // Create the mood router with dependencies
          const router = await createRouter({
            logger,
            config,
          });

          // Mount the router at the plugin's API endpoint
          httpRouter.use( router);

          logger.info('✅ Mood plugin backend initialized successfully at /api/mood-plugin');
        } catch (error) {
          logger.error('❌ Failed to initialize mood plugin backend:', error instanceof Error ? error : { error: String(error) });
          throw error;
        }
      },
    });
  },
});

export default moodPlugin;