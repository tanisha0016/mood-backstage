import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const moodProducerPlugin = createPlugin({
  id: 'mood-producer',
  routes: {
    root: rootRouteRef,
  },
});

export const MoodProducerPage = moodProducerPlugin.provide(
  createRoutableExtension({
    name: 'MoodProducerPage',
    component: () =>
      import('./components/ExampleComponent').then(m => m.ExampleComponent),
    mountPoint: rootRouteRef,
  }),
);
