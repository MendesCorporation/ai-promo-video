/** @jsxImportSource @revideo/2d/lib */
import {makeProject} from '@revideo/core';
import qanodePromo from './scene';

export default makeProject({
  name: 'QANode Advanced Promo',
  scenes: [qanodePromo],
  settings: {
    shared: {
      size: {x: 1920, y: 1080},
      background: '#060609',
    },
    rendering: {fps: 30},
    preview: {fps: 30},
  },
});
