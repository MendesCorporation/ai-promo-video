/** @jsxImportSource @revideo/2d/lib */
import {Circle, Img, Layout, Line, Path, Rect, Txt, blur, makeScene2D} from '@revideo/2d';
import {
  all,
  createRef,
  easeInBack,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  sequence,
  waitFor,
} from '@revideo/core';
import {trackReveal} from '../../../assets/revideo-template/kinetic';
import logo from '../logo-transparent.png';

const BG = '#07080c';
const SURFACE = '#101115';
const SIDEBAR = '#18191e';
const PANEL = '#1b1c21';
const LINE = '#2b2d34';
const FG = '#f4f4f5';
const MUTED = '#9b9ca5';
const ACCENT = '#6366f1';
const GREEN = '#22c55e';
const CURSOR_PATH = 'M5 3v42l11-10 8 18 8-4-8-17h16L5 3Z';

const menuLabels = [
  'Painel', 'Projetos', 'Cenários', 'Execuções', 'Defeitos', 'Suítes',
  'Variáveis', 'Credenciais', 'Componentes', 'Relatórios', 'Configurações',
];

const iconPaths = [
  'M-9 -9H-2V-2H-9ZM2 -9H9V-2H2ZM-9 2H-2V9H-9ZM2 2H9V9H2Z',
  'M-10 -7H-2L1 -3H10V8H-10Z',
  'M-10 0H-5L-2 -7L3 7L6 0H10',
  'M-8 -10L9 0L-8 10Z',
  'M0 -10V10M-8 -6L8 6M8 -6L-8 6',
  'M-9 -8H9V8H-9ZM-9 -2H9',
];

function MenuIcon(props: {index: number}) {
  return <Path data={iconPaths[props.index % iconPaths.length]} x={-82} fill={'#00000000'} stroke={MUTED} lineWidth={2} scale={0.82} />;
}

function ScenarioRow(props: {name: string; date: string; status: string; index: number; ref: ReturnType<typeof createRef<Rect>>}) {
  const statusColor = props.status === 'ok' ? GREEN : props.status === 'warn' ? '#f59e0b' : '#ef4444';
  return (
    <Rect ref={props.ref} x={155} y={-245 + props.index * 62} width={1320} height={60} fill={props.index % 2 ? '#17181c' : '#191a1f'} stroke={LINE} lineWidth={1} opacity={0} scaleY={0.2}>
      <Line points={[[-630, -10], [-630, 10]]} stroke={ACCENT} lineWidth={2.5}>
        <Circle size={6} y={-11} fill={SURFACE} stroke={ACCENT} lineWidth={2} />
        <Circle size={6} y={11} fill={SURFACE} stroke={ACCENT} lineWidth={2} />
      </Line>
      <Txt text={props.name} x={-340} width={540} textAlign={'left'} fill={FG} fontSize={15} fontWeight={620} fontFamily={'Inter, sans-serif'} />
      <Txt text={'-'} x={10} fill={MUTED} fontSize={14} fontFamily={'Inter, sans-serif'} />
      <Txt text={'QANode'} x={150} fill={'#d4d4d8'} fontSize={14} fontFamily={'Inter, sans-serif'} />
      <Circle size={8} x={300} fill={statusColor} shadowColor={`${statusColor}88`} shadowBlur={12} />
      <Txt text={props.date} x={405} fill={'#d4d4d8'} fontSize={14} fontFamily={'Inter, sans-serif'} />
      <Rect x={570} width={112} height={34} radius={11} fill={GREEN}>
        <Path data={'M-8 -8L7 0L-8 8Z'} x={-34} scale={0.62} fill={'#ffffff'} />
        <Txt text={'Executar'} x={12} fill={'#ffffff'} fontSize={13} fontWeight={570} fontFamily={'Inter, sans-serif'} />
      </Rect>
      <Rect x={645} width={28} height={28} radius={8} fill={'#292b31'}>
        <Circle size={3} y={-7} fill={MUTED} />
        <Circle size={3} fill={MUTED} />
        <Circle size={3} y={7} fill={MUTED} />
      </Rect>
    </Rect>
  );
}

export default makeScene2D('qanode-menu-assembly', function* (view) {
  view.fill(BG);

  const screen = createRef<Layout>();
  const screenFrame = createRef<Rect>();
  const brand = createRef<Layout>();
  const menuItems = menuLabels.map(() => createRef<Layout>());
  const menuBackgrounds = menuLabels.map(() => createRef<Rect>());
  const menuTexts = menuLabels.map(() => createRef<Txt>());
  const scenarioTitle = createRef<Txt>();
  const newScenario = createRef<Rect>();
  const search = createRef<Rect>();
  const tableHeader = createRef<Rect>();
  const scenarioRows = Array.from({length: 10}, () => createRef<Rect>());
  const cursor = createRef<Path>();
  const click = createRef<Circle>();
  const depthLine = createRef<Line>();

  const scenarios = [
    ['Demo QANode - Preencher formulário', '7/14/2026', 'ok'],
    ['Demo QANode - Storage da sessão', '7/6/2026', 'ok'],
    ['demo', '7/6/2026', 'warn'],
    ['Run hint QA - untreated 04 generic api 500', '7/3/2026', 'fail'],
    ['Run hint QA - treated 14 expected effect missing', '7/3/2026', 'fail'],
    ['Run hint QA - treated 13 not editable', '7/3/2026', 'fail'],
    ['Run hint QA - treated 12 file unavailable', '7/3/2026', 'fail'],
    ['Run hint QA - treated 11 expression variable', '7/3/2026', 'fail'],
    ['Run hint QA - treated 10 session credential', '7/3/2026', 'fail'],
    ['Run hint QA - untreated 03 database constraint', '7/3/2026', 'fail'],
  ] as const;

  view.add(
    <>
      <Circle size={1040} x={-850} y={-560} fill={'#6366f11d'} filters={[blur(120)]} />
      <Circle size={820} x={880} y={520} fill={'#22d3ee12'} filters={[blur(130)]} />
      <Line ref={depthLine} points={[[-960, 390], [-520, 210], [-80, 300], [400, 80], [960, 180]]} stroke={'#6366f126'} lineWidth={2} end={0} />

      <Layout ref={screen} x={120} y={55} scale={0.72} rotation={-8} skewY={-10} opacity={0}>
        <Rect ref={screenFrame} width={1600} height={1000} radius={28} fill={SURFACE} stroke={'#ffffff24'} lineWidth={2} shadowColor={'#000000ee'} shadowBlur={110} clip>
          <Rect width={220} height={1000} x={-690} fill={SIDEBAR} />
          <Line points={[[-580, -500], [-580, 500]]} stroke={LINE} lineWidth={1} />

          <Layout ref={brand} x={-690} y={-468} opacity={0}>
            <Img src={logo} width={38} height={38} x={-75} />
            <Txt text={'QANode'} x={5} fill={FG} fontSize={23} fontWeight={750} fontFamily={'Inter, sans-serif'} />
          </Layout>

          {menuLabels.map((label, index) => (
            <Layout ref={menuItems[index]} x={-720} y={-402 + index * 43} opacity={0} filters={[blur(9)]}>
              <Rect ref={menuBackgrounds[index]} width={202} height={40} radius={10} fill={'#292844'} opacity={0} scaleX={0.75} />
              <MenuIcon index={index} />
              <Txt ref={menuTexts[index]} text={label} x={8} width={128} textAlign={'left'} fill={MUTED} fontSize={15} fontWeight={index === 2 ? 570 : 450} fontFamily={'Inter, sans-serif'} />
            </Layout>
          ))}

          <Txt ref={scenarioTitle} text={'Cenários'} x={-470} y={-455} fill={FG} fontSize={29} fontWeight={760} letterSpacing={-0.8} fontFamily={'Inter, sans-serif'} opacity={0} />
          <Rect ref={newScenario} x={645} y={-458} width={140} height={42} radius={13} fill={ACCENT} opacity={0} scale={0.7}>
            <Txt text={'＋  Novo Cenário'} fill={'#ffffff'} fontSize={14} fontWeight={540} fontFamily={'Inter, sans-serif'} />
          </Rect>
          <Rect ref={search} x={-430} y={-395} width={300} height={40} radius={11} fill={'#292a2f'} opacity={0} scaleX={0.55}>
            <Circle x={-128} size={13} stroke={'#737580'} lineWidth={1.5} />
            <Line points={[[-123, 5], [-118, 10]]} stroke={'#737580'} lineWidth={1.5} />
            <Txt text={'Buscar cenários...'} x={22} width={230} textAlign={'left'} fill={'#686a73'} fontSize={14} fontStyle={'italic'} fontFamily={'Inter, sans-serif'} />
          </Rect>
          <Rect ref={tableHeader} x={105} y={-330} width={1320} height={42} fill={'#27282d'} opacity={0} scaleX={0.4}>
            {[
              ['NOME', -610], ['PROJETO', 0], ['CRIADO POR', 140], ['STATUS', 290], ['ATUALIZADO', 430], ['AÇÕES', 630],
            ].map(([label, x]) => <Txt text={String(label)} x={Number(x)} fill={'#777983'} fontSize={11} fontWeight={650} letterSpacing={0.6} fontFamily={'Inter, sans-serif'} />)}
          </Rect>
          {scenarios.map(([name, date, status], index) => <ScenarioRow ref={scenarioRows[index]} name={name} date={date} status={status} index={index} />)}

          <Circle ref={click} size={32} fill={'#818cf820'} stroke={'#a5b4fc'} lineWidth={2} opacity={0} zIndex={90} />
          <Path ref={cursor} data={CURSOR_PATH} x={-190} y={80} fill={'#ffffff'} stroke={'#08090d'} lineWidth={3} scale={1.08} opacity={0} shadowColor={'#000000aa'} shadowBlur={18} zIndex={100} />
        </Rect>
      </Layout>
    </>,
  );

  // 0.0–0.85 — establish the empty application shell before the camera locks onto navigation.
  yield* all(
    screen().opacity(1, 0.35),
    screen().scale(0.82, 0.85, easeOutBack),
    screen().rotation(-5.5, 0.85, easeOutCubic),
    screen().skew.y(-7, 0.85, easeOutCubic),
    screen().position([80, 35], 0.85, easeOutCubic),
    depthLine().end(1, 0.85, easeInOutCubic),
  );

  // 0.85–1.50 — zoom hard into the left rail; this becomes the camera's subject.
  yield* all(
    brand().opacity(1, 0.3),
    brand().x(-680, 0.45, easeOutCubic),
    screen().scale(1.5, 0.65, easeInOutCubic),
    screen().rotation(-2.2, 0.65, easeInOutCubic),
    screen().skew.y(-2.5, 0.65, easeInOutCubic),
    screen().position([530, 260], 0.65, easeInOutCubic),
  );

  // 1.50–2.85 — navigation assembles top-to-bottom while the camera tracks down the rail.
  yield* all(
    sequence(0.09, ...menuItems.map((item) => all(
      item().opacity(1, 0.22),
      item().x(-690, 0.38, easeOutCubic),
      item().filters.blur(0, 0.34, easeOutCubic),
    ))),
    screen().scale(1.56, 1.35, easeInOutCubic),
    screen().rotation(-1.25, 1.35, easeInOutCubic),
    screen().skew.y(-1.45, 1.35, easeInOutCubic),
    screen().position([555, 25], 1.35, easeInOutCubic),
  );

  // 2.85–3.45 — reacquire Scenarios in a tight focus and bring the cursor into frame.
  yield* cursor().opacity(1, 0.12);
  yield* all(
    cursor().position([-690, -316], 0.6, easeInOutCubic),
    screen().scale(1.62, 0.6, easeInOutCubic),
    screen().rotation(-0.7, 0.6, easeInOutCubic),
    screen().skew.y(-0.75, 0.6, easeInOutCubic),
    screen().position([585, 365], 0.6, easeInOutCubic),
  );
  click().position(cursor().position());

  // 3.45–3.93 — click compression and camera kick.
  yield* all(
    click().opacity(1, 0.06),
    click().scale(3.1, 0.38, easeOutCubic),
    cursor().scale(0.8, 0.06).to(1.08, 0.16),
    menuBackgrounds[2]().opacity(1, 0.24),
    menuBackgrounds[2]().scale.x(1, 0.38, easeOutBack),
    menuTexts[2]().fill('#818cf8', 0.28),
    screen().scale(1.7, 0.1, easeOutCubic).to(1.6, 0.38, easeOutBack),
    screen().rotation(0.1, 0.1, easeOutCubic).to(-0.65, 0.38, easeOutCubic),
    screen().position([610, 360], 0.1, easeOutCubic).to([575, 365], 0.38, easeOutCubic),
    click().opacity(0, 0.25),
  );

  // 3.93–4.68 — lateral camera move from the navigation rail to the page header.
  yield* all(
    trackReveal(scenarioTitle, {duration: 0.55, fromTracking: 13, toTracking: -0.8, blur: 8}),
    scenarioTitle().x(-505, 0.55, easeOutCubic),
    newScenario().opacity(1, 0.3),
    newScenario().scale(1, 0.6, easeOutBack),
    cursor().opacity(0, 0.2),
    screen().scale(1.25, 0.75, easeInOutCubic),
    screen().rotation(1.2, 0.75, easeInOutCubic),
    screen().skew.y(1.1, 0.75, easeInOutCubic),
    screen().position([-160, 470], 0.75, easeInOutCubic),
  );

  // 4.68–5.25 — page controls assemble while the camera settles over the table origin.
  yield* all(
    sequence(0.1,
      all(search().opacity(1, 0.28), search().scale.x(1, 0.48, easeOutCubic)),
      all(tableHeader().opacity(1, 0.26), tableHeader().scale.x(1, 0.48, easeOutCubic)),
    ),
    screen().scale(1.18, 0.57, easeInOutCubic),
    screen().rotation(0.35, 0.57, easeInOutCubic),
    screen().skew.y(0.35, 0.57, easeInOutCubic),
    screen().position([-124, 260], 0.57, easeInOutCubic),
  );

  // 5.25–6.65 — rows assemble top-to-bottom and the camera travels with their leading edge.
  yield* all(
    sequence(0.085, ...scenarioRows.map((row) => all(
      row().opacity(1, 0.25),
      row().scale.y(1, 0.46, easeOutBack),
      row().x(105, 0.46, easeOutCubic),
    ))),
    screen().scale(1.22, 1.4, easeInOutCubic),
    screen().rotation(-0.8, 1.4, easeInOutCubic),
    screen().skew.y(-0.65, 1.4, easeInOutCubic),
    screen().position([-92, -210], 1.4, easeInOutCubic),
  );

  // 6.65–7.40 — lateral proof sweep toward status and actions.
  yield* all(
    screen().scale(1.34, 0.75, easeInOutCubic),
    screen().rotation(0.9, 0.75, easeInOutCubic),
    screen().skew.y(0.75, 0.75, easeInOutCubic),
    screen().position([-445, -125], 0.75, easeInOutCubic),
  );

  // 7.40–8.15 — open back out to reveal the completed product as one composition.
  yield* all(
    screen().scale(0.91, 0.75, easeOutBack),
    screen().rotation(-2.1, 0.75, easeOutCubic),
    screen().skew.y(-1.8, 0.75, easeOutCubic),
    screen().position([20, 0], 0.75, easeOutCubic),
  );

  // 8.15–9.45 — restrained living drift and final exit.
  yield* all(
    screen().scale(0.95, 0.75, easeInOutCubic),
    screen().rotation(-1.2, 0.75, easeInOutCubic),
    screen().skew.y(-0.9, 0.75, easeInOutCubic),
    screen().position([-20, -12], 0.75, easeInOutCubic),
  );
  yield* all(
    screen().opacity(0, 0.55),
    screen().scale(1.03, 0.55, easeInBack),
    screen().position([-55, -34], 0.55, easeInBack),
    depthLine().opacity(0, 0.45),
  );
});
