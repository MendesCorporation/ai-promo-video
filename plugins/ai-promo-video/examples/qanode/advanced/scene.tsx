/** @jsxImportSource @revideo/2d/lib */
import {Audio, Circle, Img, Layout, Line, Path, Rect, Txt, Video, blur, makeScene2D} from '@revideo/2d';
import {all, createRef, easeInOutCubic, easeOutBack, easeOutCubic, sequence, waitFor} from '@revideo/core';
import dashboard from '../captures/dashboard.png';
import editor from '../captures/editor.png';
import logo from '../logo-transparent.png';

const BG = '#060609';
const PANEL = '#11131a';
const FG = '#fafafa';
const MUTED = '#a1a1aa';
const ACCENT = '#6366f1';
const CYAN = '#22d3ee';
const CURSOR_PATH = 'M5 3v42l11-10 8 18 8-4-8-17h16L5 3Z';

function Cursor(props: {ref: ReturnType<typeof createRef<Path>>; x: number; y: number; opacity?: number}) {
  return <Path ref={props.ref} data={CURSOR_PATH} fill={FG} stroke={'#090a0f'} lineWidth={3} scale={1.2} x={props.x} y={props.y} opacity={props.opacity ?? 1} shadowColor={'#000000aa'} shadowBlur={16} />;
}

export default makeScene2D('qanode-advanced-promo', function* (view) {
  view.fill(BG);
  const intro = createRef<Layout>();
  const introTitle = createRef<Txt>();
  const orbit = createRef<Circle>();

  const assembly = createRef<Layout>();
  const assemblyFrame = createRef<Rect>();
  const assemblySidebar = createRef<Rect>();
  const assemblyHeader = createRef<Rect>();
  const assemblyCards = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const assemblyRows = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const dashboardImage = createRef<Img>();

  const perspective = createRef<Layout>();
  const perspectiveFrame = createRef<Rect>();
  const perspectiveCursor = createRef<Path>();
  const perspectiveTrace = createRef<Line>();
  const perspectiveClick = createRef<Circle>();

  const cursorTour = createRef<Layout>();
  const cursorFrame = createRef<Rect>();
  const flowRecording = createRef<Video>();
  const tourCursor = createRef<Path>();
  const tourClick = createRef<Circle>();
  const focusLabel = createRef<Rect>();

  const features = createRef<Layout>();
  const featureTitle = createRef<Txt>();
  const featureCards = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];

  const cta = createRef<Layout>();
  const ctaTitle = createRef<Txt>();
  const ctaButton = createRef<Rect>();

  view.add(
    <>
      <Audio src={'qanode-music.mp3'} play={true} volume={0.28} />
      <Circle size={980} x={-860} y={-520} fill={'#6366f125'} filters={[blur(105)]} />
      <Circle size={840} x={850} y={500} fill={'#22d3ee18'} filters={[blur(120)]} />
      <Line points={[[-960, 430], [-580, 260], [-210, 350], [170, 210], [540, 310], [960, 100]]} stroke={'#6366f118'} lineWidth={2} />

      <Layout ref={intro} opacity={0} y={36}>
        <Layout x={-760} y={-430} layout alignItems={'center'} gap={18}>
          <Img src={logo} width={58} height={58} />
          <Txt text={'QANode'} fill={FG} fontSize={30} fontWeight={760} fontFamily={'Inter, sans-serif'} />
        </Layout>
        <Rect x={-655} y={-180} width={315} height={46} radius={23} fill={'#6366f116'} stroke={'#818cf84c'} lineWidth={1}>
          <Txt text={'AUTOMAÇÃO DE QUALIDADE'} fill={'#dbeafe'} fontSize={16} fontWeight={760} letterSpacing={2.2} fontFamily={'Inter, sans-serif'} />
        </Rect>
        <Txt ref={introTitle} text={'Seu release não pode\ndepender de sorte.'} fill={FG} x={-180} y={40} width={1500} fontSize={112} lineHeight={116} fontWeight={800} letterSpacing={-5.2} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Txt text={'Transforme fluxos críticos em testes visuais, reproduzíveis e prontos para executar.'} fill={MUTED} x={-385} y={260} width={1120} fontSize={28} fontWeight={450} fontFamily={'Inter, sans-serif'} />
        <Circle ref={orbit} x={650} y={-90} size={250} stroke={'#6366f1aa'} lineWidth={2} lineDash={[10, 15]}>
          <Circle size={48} x={110} y={-35} fill={CYAN} shadowColor={CYAN} shadowBlur={35} />
        </Circle>
      </Layout>

      <Layout ref={assembly} opacity={0}>
        <Txt text={'A interface ganha forma. O fluxo ganha clareza.'} fill={FG} y={-455} fontSize={52} fontWeight={760} letterSpacing={-2} fontFamily={'Inter, sans-serif'} />
        <Rect ref={assemblyFrame} width={1580} height={940} y={70} radius={30} fill={PANEL} stroke={'#ffffff1f'} lineWidth={2} shadowColor={'#000000cc'} shadowBlur={85} clip opacity={0} scale={0.86}>
          <Rect ref={assemblySidebar} width={220} height={940} x={-900} fill={'#191b23'} opacity={0} />
          <Rect ref={assemblyHeader} width={1360} height={72} x={110} y={-530} fill={'#181b23'} opacity={0} />
          {assemblyCards.map((ref, index) => <Rect ref={ref} width={275} height={130} x={-520 + index * 300} y={-100} radius={18} fill={index === 1 ? '#6366f12c' : '#ffffff0a'} stroke={index === 1 ? '#818cf86c' : '#ffffff12'} lineWidth={2} opacity={0} scale={0.6} />)}
          {assemblyRows.map((ref, index) => <Rect ref={ref} width={1120} height={78} x={110} y={135 + index * 96} radius={12} fill={'#ffffff08'} opacity={0} />)}
        </Rect>
        <Img ref={dashboardImage} src={dashboard} width={1504} height={940} y={70} radius={27} clip opacity={0} zIndex={30} shadowColor={'#00000099'} shadowBlur={45} />
      </Layout>

      <Layout ref={perspective} opacity={0}>
        <Rect x={-645} y={-405} width={350} height={45} radius={23} fill={'#22d3ee12'} stroke={'#22d3ee55'} lineWidth={1}>
          <Txt text={'CANVAS VISUAL · CONTROLE TOTAL'} fill={'#cffafe'} fontSize={15} fontWeight={760} letterSpacing={2} fontFamily={'Inter, sans-serif'} />
        </Rect>
        <Txt text={'Veja cada passo.\nMova-se pelo cenário.'} fill={FG} x={-355} y={-260} width={900} fontSize={72} lineHeight={76} fontWeight={790} letterSpacing={-3.5} fontFamily={'Inter, sans-serif'} />
        <Rect ref={perspectiveFrame} width={1460} height={820} x={260} y={110} radius={30} fill={PANEL} stroke={'#ffffff26'} lineWidth={2} shadowColor={'#000000ee'} shadowBlur={95} clip opacity={0} scale={0.68} rotation={-9} skewY={-18}>
          <Img src={editor} width={1460} height={912.5} />
        </Rect>
        <Line ref={perspectiveTrace} points={[[-540, 250], [-230, 120], [95, 205], [335, 15]]} stroke={'#22d3eea0'} lineWidth={4} end={0} lineDash={[10, 15]} />
        <Circle ref={perspectiveClick} size={32} fill={'#22d3ee1f'} stroke={'#67e8f9'} lineWidth={2} opacity={0} />
        <Cursor ref={perspectiveCursor} x={-560} y={280} opacity={0} />
      </Layout>

      <Layout ref={cursorTour} opacity={0}>
        <Txt text={'Aponte. Execute. Acompanhe.'} fill={FG} y={-455} fontSize={58} fontWeight={780} letterSpacing={-2.6} fontFamily={'Inter, sans-serif'} />
        <Rect ref={cursorFrame} width={1580} height={920} y={80} radius={30} fill={PANEL} stroke={'#ffffff20'} lineWidth={2} shadowColor={'#000000dd'} shadowBlur={80} clip opacity={0} scale={0.9}>
          <Video ref={flowRecording} src={'dashboard-to-flows.mp4'} width={1472} height={920} decoder={'web'} />
        </Rect>
        <Rect ref={focusLabel} x={575} y={-280} width={265} height={54} radius={27} fill={'#22c55e'} opacity={0} scale={0.75}>
          <Txt text={'EXECUTAR CENÁRIO'} fill={'#ffffff'} fontSize={16} fontWeight={800} letterSpacing={1.2} fontFamily={'Inter, sans-serif'} />
        </Rect>
        <Circle ref={tourClick} size={34} fill={'#22d3ee22'} stroke={'#67e8f9'} lineWidth={2} opacity={0} />
        <Cursor ref={tourCursor} x={-500} y={300} opacity={0} />
      </Layout>

      <Layout ref={features} opacity={0}>
        <Txt ref={featureTitle} text={'Não é um template.\nÉ uma linguagem de movimento.'} fill={FG} y={-330} fontSize={82} lineHeight={86} fontWeight={800} letterSpacing={-4} fontFamily={'Inter, sans-serif'} opacity={0} />
        {[
          ['01', 'Web, API e dados', 'Formas, imagens, SVG e vídeo no mesmo canvas.'],
          ['02', 'Perspectiva e profundidade', 'Câmera, parallax, máscaras, filtros e shaders.'],
          ['03', 'Timing sob controle', 'Mouse, clicks, cards e transições dirigidos pela IA.'],
        ].map(([number, title, body], index) => <Rect ref={featureCards[index]} x={-580 + index * 580} y={170} width={520} height={310} radius={28} fill={'#ffffff0a'} stroke={index === 1 ? '#818cf86a' : '#ffffff18'} lineWidth={2} shadowColor={'#00000080'} shadowBlur={50} opacity={0} scale={0.62} rotation={-7 + index * 7}>
          <Rect x={-195} y={-100} width={58} height={42} radius={13} fill={'#6366f128'}><Txt text={number} fill={'#c7d2fe'} fontSize={17} fontWeight={800} fontFamily={'Inter, sans-serif'} /></Rect>
          <Txt text={title} fill={FG} x={0} y={-20} width={420} fontSize={31} fontWeight={750} fontFamily={'Inter, sans-serif'} />
          <Txt text={body} fill={MUTED} x={0} y={76} width={420} fontSize={20} lineHeight={28} fontWeight={430} fontFamily={'Inter, sans-serif'} />
        </Rect>)}
      </Layout>

      <Layout ref={cta} opacity={0}>
        <Layout y={-310} layout alignItems={'center'} gap={18}>
          <Img src={logo} width={62} height={62} />
          <Txt text={'QANode'} fill={FG} fontSize={32} fontWeight={780} fontFamily={'Inter, sans-serif'} />
        </Layout>
        <Txt ref={ctaTitle} text={'Teste com confiança.\nEntregue no ritmo.'} fill={FG} y={-40} fontSize={116} lineHeight={120} fontWeight={820} letterSpacing={-5.6} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Txt text={'Comece pelo fluxo crítico do seu produto.'} fill={MUTED} y={205} fontSize={29} fontWeight={450} fontFamily={'Inter, sans-serif'} />
        <Rect ref={ctaButton} y={310} width={385} height={72} radius={22} fill={ACCENT} shadowColor={'#6366f188'} shadowBlur={55} scale={0.7} opacity={0}>
          <Txt text={'TRANSFORME SEU PRÓXIMO TESTE'} fill={FG} fontSize={16} fontWeight={820} letterSpacing={1.3} fontFamily={'Inter, sans-serif'} />
        </Rect>
        <Txt text={'“Motivational Day” — UNIVERSFIELD · CC BY 4.0'} fill={'#71717a'} y={495} fontSize={13} fontFamily={'Inter, sans-serif'} />
      </Layout>
    </>,
  );

  // 0.0–4.5s — opening statement
  yield* all(intro().opacity(1, 0.8), intro().y(0, 0.8, easeOutCubic), introTitle().opacity(1, 0.65), introTitle().x(-190, 0.8, easeOutCubic), orbit().rotation(95, 0.8, easeInOutCubic));
  yield* waitFor(2.9);
  yield* all(intro().opacity(0, 0.8), intro().scale(1.05, 0.8, easeInOutCubic));

  // 4.5–10.0s — UI pieces assemble, then resolve into the real product
  assembly().opacity(1);
  yield* all(assemblyFrame().opacity(1, 0.45), assemblyFrame().scale(1, 0.7, easeOutBack));
  yield* sequence(0.12,
    all(assemblySidebar().opacity(1, 0.35), assemblySidebar().x(-680, 0.6, easeOutCubic)),
    all(assemblyHeader().opacity(1, 0.35), assemblyHeader().y(-434, 0.6, easeOutCubic)),
    ...assemblyCards.map((card, index) => all(card().opacity(1, 0.3), card().scale(1, 0.6, easeOutBack), card().position([-510 + index * 310, -100], 0.6, easeOutCubic))),
  );
  yield* dashboardImage().opacity(1, 0.5);
  yield* waitFor(2.3);
  yield* all(assembly().opacity(0, 0.8), assembly().scale(1.04, 0.8, easeInOutCubic));

  // 10.0–16.0s — product screen lands in perspective and the cursor tours it
  perspective().opacity(1);
  yield* all(perspectiveFrame().opacity(1, 0.5), perspectiveFrame().scale(0.95, 1.1, easeOutBack), perspectiveFrame().rotation(-2, 1.1, easeOutCubic), perspectiveFrame().skew.y(-6, 1.1, easeOutCubic), perspectiveFrame().position([180, 100], 1.1, easeOutCubic));
  yield* all(perspectiveTrace().end(1, 1.4, easeInOutCubic), perspectiveCursor().opacity(1, 0.2), perspectiveCursor().position([335, 15], 1.4, easeInOutCubic));
  perspectiveClick().position(perspectiveCursor().position());
  yield* all(perspectiveClick().opacity(1, 0.08), perspectiveClick().scale(2.8, 0.4, easeOutCubic), perspectiveCursor().scale(0.82, 0.08).to(1, 0.16));
  yield* waitFor(2.3);
  yield* all(perspective().opacity(0, 0.8), perspective().x(-80, 0.8, easeInOutCubic));

  // 16.0–21.0s — cursor targets a real action and the camera focuses on it
  cursorTour().opacity(1);
  flowRecording().play();
  yield* all(cursorFrame().opacity(1, 0.4), cursorFrame().scale(1, 0.6, easeOutBack), tourCursor().opacity(1, 0.2));
  yield* tourCursor().position([620, -270], 1.2, easeInOutCubic);
  tourClick().position(tourCursor().position());
  yield* all(tourClick().opacity(1, 0.06), tourClick().scale(2.7, 0.3, easeOutCubic), tourCursor().scale(0.8, 0.06).to(1, 0.14));
  yield* all(focusLabel().opacity(1, 0.35), focusLabel().scale(1, 0.8, easeOutBack), cursorFrame().scale(1.08, 0.8, easeInOutCubic), cursorFrame().x(-45, 0.8, easeInOutCubic));
  yield* waitFor(1.3);
  yield* all(cursorTour().opacity(0, 0.8), cursorTour().scale(1.04, 0.8, easeInOutCubic));

  // 21.0–25.0s — modular cards, all authored for this story
  features().opacity(1);
  yield* all(featureTitle().opacity(1, 0.6), featureTitle().y(-350, 0.8, easeOutCubic), sequence(0.15, ...featureCards.map((card) => all(card().opacity(1, 0.35), card().scale(1, 0.7, easeOutBack), card().rotation(0, 0.7, easeOutCubic)))));
  yield* waitFor(2.2);
  yield* all(features().opacity(0, 0.8), features().y(-35, 0.8, easeInOutCubic));

  // 25.0–30.0s — clean, branded CTA
  cta().opacity(1);
  yield* all(ctaTitle().opacity(1, 0.75), ctaTitle().y(-60, 1.0, easeOutCubic), ctaButton().opacity(1, 0.45), ctaButton().scale(1, 0.9, easeOutBack));
  yield* waitFor(3.5);
  yield* cta().opacity(0, 0.5);
});
