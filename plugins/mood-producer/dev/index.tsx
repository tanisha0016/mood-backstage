import { createDevApp } from '@backstage/dev-utils';
import { moodProducerPlugin, MoodProducerPage } from '../src/plugin';

createDevApp()
  .registerPlugin(moodProducerPlugin)
  .addPage({
    element: <MoodProducerPage />,
    title: 'Root Page',
    path: '/mood-producer',
  })
  .render();
