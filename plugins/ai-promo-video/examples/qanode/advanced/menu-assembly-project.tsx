/** @jsxImportSource @revideo/2d/lib */
import {makeProject} from '@revideo/core';
import menuAssembly from './menu-assembly-scene';

export default makeProject({
  name: 'QANode Menu Assembly',
  scenes: [menuAssembly],
  settings: {
    shared: {
      size: {x: 1920, y: 1080},
      background: '#07080c',
    },
    rendering: {fps: 30},
    preview: {fps: 30},
  },
});
