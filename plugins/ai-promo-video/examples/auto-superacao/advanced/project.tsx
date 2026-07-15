/** @jsxImportSource @revideo/2d/lib */
import {makeProject} from '@revideo/core';
import scene from './scene';

export default makeProject({
  name: 'AINDA — um filme sobre continuar',
  scenes: [scene],
  settings: {
    shared: {
      size: {x: 1920, y: 1080},
      background: '#070910',
    },
    rendering: {fps: 30},
    preview: {fps: 30},
  },
});
