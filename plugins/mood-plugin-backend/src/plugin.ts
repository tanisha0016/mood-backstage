import { createBackendPlugin, coreServices } from '@backstage/backend-plugin-api';
import { createRouter } from './services/TodoListService/router';

export const moodPluginPlugin = createBackendPlugin({
  pluginId: 'mood-plugin',
  register(env) {
    env.registerInit({
      deps: {
        router: coreServices.httpRouter,
      },
      async init({ router }) {
        const moodRouter = await createRouter();
        router.use( moodRouter);
      },
    });
  },
});

// 👇 this allows both default and named import
export default moodPluginPlugin;
