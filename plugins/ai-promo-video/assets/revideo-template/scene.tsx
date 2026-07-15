/** @jsxImportSource @revideo/2d/lib */
import {Circle, Line, Path, Rect, Txt, blur, makeScene2D} from '@revideo/2d';
import {all, createRef, createRefArray, easeInOutCubic, easeOutBack, easeOutCubic, sequence, waitFor} from '@revideo/core';
import {trackReveal} from './kinetic';

const CURSOR_PATH = 'M5 3v42l11-10 8 18 8-4-8-17h16L5 3Z';

export default makeScene2D('advanced-motion', function* (view) {
  view.fill('#070910');
  const title = createRef<Txt>();
  const panel = createRef<Rect>();
  const sidebar = createRef<Rect>();
  const header = createRef<Rect>();
  const cards = createRefArray<Rect>();
  const cursor = createRef<Path>();
  const click = createRef<Circle>();
  const trace = createRef<Line>();
  const cardTargets = [-350, -60, 230, 520];

  view.add(
    <>
      <Circle size={820} x={-780} y={-430} fill={'#6366f122'} filters={[blur(80)]} />
      <Circle size={720} x={780} y={430} fill={'#22d3ee1c'} filters={[blur(90)]} />
      <Txt ref={title} y={-400} text={'Motion without templates.'} fill={'#f8fafc'} fontFamily={'Inter, sans-serif'} fontSize={76} fontWeight={760} opacity={0} />
      <Rect ref={panel} width={1460} height={720} y={70} radius={34} fill={'#11141d'} stroke={'#ffffff20'} lineWidth={2} shadowColor={'#000000aa'} shadowBlur={70} opacity={0} scale={0.82} rotation={-5} skewY={-10} clip>
        <Rect ref={sidebar} width={240} height={720} x={-850} fill={'#171a24'} opacity={0} />
        <Rect ref={header} width={1220} height={86} x={120} y={-470} fill={'#181c27'} opacity={0} />
        {[0, 1, 2, 3].map((index) => <Rect ref={cards} width={250} height={170} radius={22} x={-530 + index * 28} y={340} rotation={-8 + index * 5} fill={index === 1 ? '#6366f12f' : '#ffffff0b'} stroke={index === 1 ? '#818cf877' : '#ffffff13'} lineWidth={2} opacity={0} scale={0.65} />)}
        {[0, 1, 2].map((index) => <Rect width={1080} height={64} radius={14} x={120} y={115 + index * 86} fill={'#ffffff08'} />)}
      </Rect>
      <Line ref={trace} points={[[-520, 250], [-210, 120], [95, 180], [380, -30]]} stroke={'#22d3ee80'} lineWidth={4} end={0} lineDash={[10, 14]} />
      <Circle ref={click} size={32} fill={'#22d3ee20'} stroke={'#67e8f9'} lineWidth={2} opacity={0} />
      <Path ref={cursor} data={CURSOR_PATH} fill={'#ffffff'} stroke={'#10131c'} lineWidth={3} scale={1.15} x={-560} y={280} opacity={0} />
    </>,
  );

  title().y(-390);
  yield* all(trackReveal(title, {duration: 0.72, fromTracking: 34}), title().y(-420, 0.72, easeOutCubic));
  yield* all(panel().opacity(1, 0.45), panel().scale(1, 1.0, easeOutBack), panel().rotation(0, 1.1, easeOutCubic), panel().skew.y(0, 1.1, easeOutCubic));
  yield* sequence(0.14,
    all(sidebar().opacity(1, 0.35), sidebar().x(-610, 0.55, easeOutCubic)),
    all(header().opacity(1, 0.35), header().y(-317, 0.55, easeOutCubic)),
    ...cards.map((card, index) => all(card.opacity(1, 0.35), card.scale(1, 0.65, easeOutBack), card.position([cardTargets[index], -115], 0.72, easeOutCubic), card.rotation(0, 0.72, easeOutCubic))),
  );
  yield* all(trace().end(1, 1.0, easeInOutCubic), cursor().opacity(1, 0.2));
  yield* cursor().position([380, -30], 1.2, easeInOutCubic);
  click().position(cursor().position());
  yield* all(click().opacity(1, 0.08), click().scale(2.6, 0.38, easeOutCubic), cursor().scale(0.82, 0.08).to(1, 0.16));
  yield* click().opacity(0, 0.2);
  yield* waitFor(1.2);
});
