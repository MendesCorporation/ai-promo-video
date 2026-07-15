/** @jsxImportSource @revideo/2d/lib */
import {makeProject} from '@revideo/core';
import scene from './scene';

export default makeProject({
  name: '__PROJECT_NAME__',
  scenes: [scene],
  settings: {
    shared: {
      size: {x: __WIDTH__, y: __HEIGHT__},
      background: '#000000',
    },
    rendering: {fps: __FPS__},
    preview: {fps: __FPS__},
  },
});
