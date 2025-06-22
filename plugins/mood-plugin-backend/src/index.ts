import { createBackendPlugin, coreServices } from '@backstage/backend-plugin-api';
import { createRouter } from './services/TodoListService/router';

export const moodPlugin = createBackendPlugin({
  pluginId: 'mood-plugin',
  register(env) {
    env.registerInit({
      deps: {
        router: coreServices.httpRouter,
      },
      async init({ router }) {
        const moodRouter = await createRouter();
        router.use(moodRouter);   // No prefix here
      },
    });
  },
});

export default moodPlugin;
