/** @jsxImportSource @revideo/2d/lib */
import {makeProject} from '@revideo/core';
import scene from './scene';

export default makeProject({
  name: 'SignalNest Motion Capability Benchmark',
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
