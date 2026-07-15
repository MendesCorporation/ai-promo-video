/** @jsxImportSource @revideo/2d/lib */
import {Circle, Rect, Txt, makeScene2D} from '@revideo/2d';
import {all, createSignal, easeInOutCubic, waitFor} from '@revideo/core';
import destinationShader from './destination.glsl';
import invertShader from './invert.glsl';

export default makeScene2D('shader-context', function* (view) {
  const distortion = createSignal(0.012);
  const phase = createSignal(0);

  view.add(
    <Rect width={480} height={270} fill={'#070814'}>
      <Circle x={-155} y={-76} size={220} fill={'#6e44ff'} />
      <Circle x={148} y={74} size={250} fill={'#00d4ff'} />
      <Rect
        width={520}
        height={48}
        rotation={-18}
        fill={'#ff4db8'}
        opacity={0.82}
      />
      <Circle
        x={-130}
        y={52}
        size={78}
        fill={'#ffd166'}
        shaders={invertShader}
      />
      <Rect
        width={314}
        height={154}
        radius={34}
        fill={'#ffffff22'}
        stroke={'#ffffffaa'}
        lineWidth={2}
        shaders={() => ({
          fragment: destinationShader,
          uniforms: {
            distortion: distortion(),
            phase: phase(),
          },
        })}
      >
        <Txt
          text={'SHADER CONTEXT'}
          fill={'#ffffff'}
          fontFamily={'Arial, sans-serif'}
          fontSize={29}
          fontWeight={800}
          letterSpacing={1.5}
        />
      </Rect>
    </Rect>,
  );

  yield* all(
    distortion(0.032, 0.75, easeInOutCubic),
    phase(1, 0.75, easeInOutCubic),
  );
  yield* all(
    distortion(0.016, 0.45, easeInOutCubic),
    phase(2, 0.45, easeInOutCubic),
  );
  yield* waitFor(0.2);
});
