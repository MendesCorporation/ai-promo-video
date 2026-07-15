/** @jsxImportSource @revideo/2d/lib */
import {makeProject} from '@revideo/core';
import scene from './scene';

export default makeProject({
  name: 'Revideo shader scene-context regression',
  experimentalFeatures: true,
  scenes: [scene],
  settings: {
    shared: {
      size: {x: 480, y: 270},
      background: '#070814',
    },
    rendering: {fps: 30},
    preview: {fps: 30},
  },
});
