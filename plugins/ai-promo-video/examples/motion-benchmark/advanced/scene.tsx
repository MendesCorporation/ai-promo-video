/** @jsxImportSource @revideo/2d/lib */
import {
  Circle,
  Gradient,
  Layout,
  Line,
  Path,
  Polygon,
  Rect,
  Txt,
  blur,
  makeScene2D,
} from '@revideo/2d';
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
import {
  arrangeTextRow,
  eraseAndType,
  gradientSweep,
  impactText,
  pushText,
  trackReveal,
  typewriter,
  wordCascade,
} from '../../../assets/revideo-template/kinetic';

const DARK = '#160c2d';
const INK = '#171021';
const MUTED = '#71677d';
const PURPLE = '#7c3aed';
const MAGENTA = '#db4fc4';
const MINT = '#58d7c4';
const CREAM = '#fffaf3';
const WHITE = '#ffffff';

const softLight = new Gradient({
  type: 'radial',
  from: [-260, -220],
  to: [0, 0],
  fromRadius: 0,
  toRadius: 1450,
  stops: [
    {offset: 0, color: '#ffffff'},
    {offset: 0.46, color: '#fbf6ff'},
    {offset: 0.78, color: '#f2ddff'},
    {offset: 1, color: '#e3b8ff'},
  ],
});

const purpleGradient = new Gradient({
  type: 'linear',
  from: [-160, -160],
  to: [160, 160],
  stops: [
    {offset: 0, color: '#9d4edd'},
    {offset: 0.52, color: '#7c3aed'},
    {offset: 1, color: '#df4fc2'},
  ],
});

const darkGradient = new Gradient({
  type: 'radial',
  from: [260, -180],
  to: [0, 0],
  fromRadius: 10,
  toRadius: 1350,
  stops: [
    {offset: 0, color: '#4d237d'},
    {offset: 0.52, color: '#24113f'},
    {offset: 1, color: '#120821'},
  ],
});

const seed = (index: number, offset = 0) => {
  const value = Math.sin((index + 1) * 12.9898 + offset * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

function LogoMark(props: {scale?: number; color?: string}) {
  const scale = props.scale ?? 1;
  return (
    <Layout scale={scale}>
      <Rect width={132} height={132} radius={38} fill={props.color ?? purpleGradient} shadowColor={'#8b5cf666'} shadowBlur={50} />
      <Path data={'M-39 -7 C-12 -42 14 -42 39 -7 C18 2 7 16 0 38 C-9 13 -20 2 -39 -7Z'} fill={WHITE} />
      <Circle size={23} y={-25} fill={WHITE} />
    </Layout>
  );
}

function Diamond(props: {x: number; y: number; size?: number; color?: string; opacity?: number}) {
  return <Polygon sides={4} size={props.size ?? 28} x={props.x} y={props.y} rotation={45} fill={props.color ?? PURPLE} opacity={props.opacity ?? 1} />;
}

function Face(props: {initials: string; color: string; x: number; y: number; rotation?: number}) {
  return (
    <Layout x={props.x} y={props.y} rotation={props.rotation ?? 0}>
      <Circle size={138} fill={props.color} stroke={WHITE} lineWidth={8} shadowColor={'#6d28d944'} shadowBlur={32} />
      <Circle size={90} y={8} fill={'#fff8ef'} />
      <Circle size={9} x={-18} y={-4} fill={INK} />
      <Circle size={9} x={18} y={-4} fill={INK} />
      <Path data={'M-18 20 Q0 38 18 20'} stroke={INK} lineWidth={6} endArrow={false} />
      <Txt text={props.initials} y={-88} fill={INK} fontSize={17} fontWeight={800} fontFamily={'Inter, sans-serif'} />
    </Layout>
  );
}

function IntegrationPill(props: {label: string; color: string; x: number; y: number; rotation?: number}) {
  return (
    <Rect x={props.x} y={props.y} rotation={props.rotation ?? 0} width={300} height={104} radius={52} fill={props.color} stroke={'#ffffffcc'} lineWidth={3} shadowColor={'#7028a422'} shadowBlur={32}>
      <Circle x={-96} size={60} fill={WHITE}>
        <Txt text={props.label.slice(0, 1)} fill={INK} fontSize={28} fontWeight={850} fontFamily={'Inter, sans-serif'} />
      </Circle>
      <Rect x={35} width={104} height={17} radius={9} fill={'#4a31503d'} />
      <Rect x={54} y={28} width={66} height={10} radius={5} fill={'#4a315025'} />
    </Rect>
  );
}

export default makeScene2D('signalnest-capability-benchmark', function* (view) {
  view.fill(DARK);

  const lightBackground = createRef<Rect>();
  const glowLeft = createRef<Circle>();
  const glowRight = createRef<Circle>();

  const intro = createRef<Layout>();
  const introTitle = createRef<Txt>();
  const introIn = createRef<Txt>();
  const introProduct = createRef<Txt>();
  const introSignals = createRef<Txt>();
  const introSub = createRef<Txt>();
  const introHalo = createRef<Circle>();
  const particles = Array.from({length: 24}, () => createRef<Circle>());

  const markScene = createRef<Layout>();
  const markWrap = createRef<Layout>();
  const markRing = createRef<Circle>();
  const markName = createRef<Txt>();

  const cloud = createRef<Layout>();
  const cloudFocus = createRef<Txt>();
  const cloudWords = ['Requests', 'Bugs', 'Ideas', 'Praise', 'Research', 'Trends', 'Roadmap', 'Signals'];
  const cloudRefs = cloudWords.map(() => createRef<Txt>());
  const cloudPositions: Array<[number, number, number]> = [
    [-710, -330, -7], [420, -350, 5], [-600, 260, 6], [560, 260, -6],
    [-780, 40, -2], [690, 40, 3], [-220, 390, -3], [270, -470, 4],
  ];

  const statement = createRef<Layout>();
  const statementIcon = createRef<Layout>();
  const statementA = createRef<Txt>();
  const statementB = createRef<Txt>();
  const statementLine = createRef<Line>();

  const integrations = createRef<Layout>();
  const integrationCore = createRef<Layout>();
  const integrationOrbit = createRef<Circle>();
  const integrationPills = Array.from({length: 5}, () => createRef<Layout>());
  const integrationCaption = createRef<Txt>();
  const integrationData = [
    ['Mail', '#f8b4d9', -610, -250, -8],
    ['Chat', '#a9efe3', 620, -250, 7],
    ['Desk', '#e7c8ff', 650, 250, -5],
    ['CRM', '#ffe3a8', -580, 300, 6],
    ['Forms', '#cbd5ff', 0, -430, 2],
  ] as const;

  const brandBreak = createRef<Layout>();
  const brandLogo = createRef<Layout>();
  const brandName = createRef<Txt>();
  const brandTagline = createRef<Txt>();
  const brandRingA = createRef<Circle>();
  const brandRingB = createRef<Circle>();

  const product = createRef<Layout>();
  const productEyebrow = createRef<Txt>();
  const productTitle = createRef<Txt>();
  const productFrame = createRef<Rect>();
  const productCards = Array.from({length: 6}, () => createRef<Rect>());
  const productCursor = createRef<Path>();
  const productClick = createRef<Circle>();
  const productFocus = createRef<Rect>();

  const roadmap = createRef<Layout>();
  const roadmapTitle = createRef<Txt>();
  const roadmapBoard = createRef<Rect>();
  const roadmapColumns = Array.from({length: 3}, () => createRef<Rect>());
  const roadmapCards = Array.from({length: 7}, () => createRef<Rect>());

  const updates = createRef<Layout>();
  const updatesTitle = createRef<Txt>();
  const updateStack = Array.from({length: 3}, () => createRef<Rect>());
  const updateTrace = createRef<Line>();
  const updateBadge = createRef<Rect>();

  const team = createRef<Layout>();
  const teamTitle = createRef<Txt>();
  const teamTitleNext = createRef<Txt>();
  const teamCore = createRef<Layout>();
  const teamOrbit = createRef<Circle>();
  const teamAvatars = Array.from({length: 4}, () => createRef<Layout>());
  const teamLines = Array.from({length: 4}, () => createRef<Line>());

  const cta = createRef<Layout>();
  const ctaLogo = createRef<Layout>();
  const ctaTitle = createRef<Txt>();
  const ctaSub = createRef<Txt>();
  const ctaButton = createRef<Rect>();
  const transitionStar = createRef<Path>();

  view.add(
    <>
      <Rect ref={lightBackground} width={1920} height={1080} fill={softLight} opacity={0} />
      <Circle ref={glowLeft} size={980} x={-760} y={-430} fill={'#f4a8ff55'} filters={[blur(95)]} opacity={0} />
      <Circle ref={glowRight} size={820} x={790} y={430} fill={'#bda5ff4d'} filters={[blur(110)]} opacity={0} />

      <Layout ref={intro} opacity={0}>
        <Circle ref={introHalo} size={680} fill={'#8b5cf61f'} stroke={'#c084fc55'} lineWidth={3} scale={0.45} />
        {particles.map((ref, index) => (
          <Circle
            ref={ref}
            size={10 + seed(index, 2) * 28}
            x={(seed(index, 4) - 0.5) * 1700}
            y={(seed(index, 7) - 0.5) * 920}
            fill={index % 3 === 0 ? MAGENTA : index % 3 === 1 ? PURPLE : MINT}
            opacity={0}
            shadowColor={index % 2 === 0 ? PURPLE : MAGENTA}
            shadowBlur={20}
          />
        ))}
        <Txt ref={introTitle} text={'Buried'} y={-78} fill={WHITE} fontFamily={'Inter, sans-serif'} fontSize={124} fontWeight={780} letterSpacing={-6} opacity={0} shadowColor={'#b76df488'} shadowBlur={46} />
        <Txt ref={introIn} text={'in'} y={-78} fill={'#d8c6e9'} fontFamily={'Inter, sans-serif'} fontSize={124} fontWeight={650} letterSpacing={-6} opacity={0} />
        <Txt ref={introProduct} text={'product'} y={78} fill={WHITE} fontFamily={'Inter, sans-serif'} fontSize={124} fontWeight={780} letterSpacing={-6} opacity={0} />
        <Txt ref={introSignals} text={'signals?'} y={78} fill={purpleGradient} fontFamily={'Inter, sans-serif'} fontSize={124} fontWeight={780} letterSpacing={-6} opacity={0} shadowColor={'#c36bf488'} shadowBlur={38} />
        <Txt ref={introSub} text={'Every request matters. Not every request is equal.'} fill={'#d9c9e8'} y={315} fontFamily={'Inter, sans-serif'} fontSize={28} fontWeight={480} opacity={0} />
      </Layout>

      <Layout ref={markScene} opacity={0}>
        <Layout ref={markWrap} scale={0.35} rotation={-24}>
          <Circle ref={markRing} size={430} stroke={'#8b5cf63d'} lineWidth={2} lineDash={[8, 17]} />
          <LogoMark scale={1.28} />
        </Layout>
        <Txt ref={markName} text={'SignalNest'} y={245} fill={INK} fontSize={72} fontWeight={800} letterSpacing={-3.2} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Diamond x={-430} y={-240} size={34} color={MAGENTA} />
        <Diamond x={460} y={260} size={24} color={MINT} />
      </Layout>

      <Layout ref={cloud} opacity={0}>
        {cloudWords.map((word, index) => (
          <Txt
            ref={cloudRefs[index]}
            text={word}
            x={cloudPositions[index][0] * 1.35}
            y={cloudPositions[index][1] * 1.35}
            rotation={cloudPositions[index][2]}
            fill={index % 3 === 0 ? '#d848bd' : index % 3 === 1 ? '#7c3aed' : '#b86bd1'}
            fontFamily={'Inter, sans-serif'}
            fontSize={36 + (index % 3) * 13}
            fontWeight={650}
            opacity={0}
            filters={[blur(7)]}
          />
        ))}
        <Txt ref={cloudFocus} text={'Product signals'} fill={INK} fontFamily={'Inter, sans-serif'} fontSize={122} fontWeight={520} letterSpacing={-6} opacity={0} scale={0.72} />
        <Circle size={710} stroke={'#b983e333'} lineWidth={2} />
        <Circle size={980} stroke={'#d59be833'} lineWidth={2} />
      </Layout>

      <Layout ref={statement} opacity={0}>
        <Layout ref={statementIcon} x={-730} scale={0.3} opacity={0}>
          <LogoMark scale={0.52} />
        </Layout>
        <Txt ref={statementA} text={'Turn noise into'} fill={INK} fontFamily={'Inter, sans-serif'} fontSize={104} fontWeight={720} letterSpacing={-5} opacity={0} />
        <Txt ref={statementB} text={'direction.'} fill={purpleGradient} fontFamily={'Inter, sans-serif'} fontSize={104} fontWeight={720} letterSpacing={-5} opacity={0} />
        <Line ref={statementLine} points={[[-515, 105], [600, 105]]} stroke={'#a855f766'} lineWidth={5} lineCap={'round'} start={0.5} end={0.5} />
      </Layout>

      <Layout ref={integrations} opacity={0}>
        <Circle ref={integrationOrbit} size={890} stroke={'#a855f74a'} lineWidth={2} lineDash={[11, 17]} scale={0.55} opacity={0} />
        <Layout ref={integrationCore} scale={0.5} opacity={0}>
          <Circle size={390} fill={'#ffffffa8'} shadowColor={'#a855f744'} shadowBlur={65} />
          <LogoMark scale={0.92} />
        </Layout>
        {integrationData.map(([label, color, x, y, rotation], index) => (
          <Layout ref={integrationPills[index]} opacity={0} scale={0.45}>
            <IntegrationPill label={label} color={color} x={x} y={y} rotation={rotation} />
          </Layout>
        ))}
        <Diamond x={-260} y={-360} size={24} color={MAGENTA} />
        <Diamond x={360} y={365} size={30} color={MINT} />
        <Txt ref={integrationCaption} text={''} y={470} fill={INK} fontSize={30} fontWeight={570} fontFamily={'Inter, sans-serif'} opacity={0} />
      </Layout>

      <Layout ref={brandBreak} opacity={0}>
        <Circle ref={brandRingA} size={740} stroke={'#b76df43b'} lineWidth={2} scale={0.55} />
        <Circle ref={brandRingB} size={1040} stroke={'#6d28d94a'} lineWidth={2} scale={0.7} />
        <Layout ref={brandLogo} x={-300} scale={0.5} opacity={0}>
          <LogoMark scale={0.82} />
        </Layout>
        <Txt ref={brandName} text={'SignalNest'} x={125} fill={WHITE} fontSize={112} fontWeight={790} letterSpacing={-5.5} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Txt ref={brandTagline} text={''} y={170} fill={'#d5b8eb'} fontSize={17} fontWeight={750} letterSpacing={4.4} fontFamily={'Inter, sans-serif'} opacity={0} />
      </Layout>

      <Layout ref={product} opacity={0}>
        <Txt ref={productEyebrow} text={'FROM SIGNAL TO SHIPPED'} x={-650} y={-405} fill={PURPLE} fontSize={17} fontWeight={820} letterSpacing={3.8} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Txt ref={productTitle} text={''} x={-420} y={-265} width={980} fill={INK} fontSize={78} lineHeight={82} fontWeight={770} letterSpacing={-4} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Rect ref={productFrame} width={1390} height={790} x={245} y={125} radius={34} fill={WHITE} stroke={'#7c3aed33'} lineWidth={3} shadowColor={'#5b267d55'} shadowBlur={90} clip scale={0.63} rotation={-10} skewY={-14} opacity={0}>
          <Rect width={1390} height={76} y={-357} fill={'#f7f2fb'}>
            <Circle x={-640} size={15} fill={'#ff8ca7'} />
            <Circle x={-612} size={15} fill={'#ffc35c'} />
            <Circle x={-584} size={15} fill={'#5ed6ad'} />
            <Rect width={430} height={31} radius={16} fill={'#e8deef'} />
          </Rect>
          <Rect x={-575} y={38} width={240} height={714} fill={'#fbf8fd'}>
            <Layout x={-28} y={-290}><LogoMark scale={0.24} /></Layout>
            {['Overview', 'Inbox', 'Roadmap', 'Updates', 'Insights'].map((label, index) => (
              <Rect y={-185 + index * 62} width={185} height={44} radius={12} fill={index === 1 ? '#eee4ff' : '#00000000'}>
                <Circle x={-65} size={13} fill={index === 1 ? PURPLE : '#b5aabd'} />
                <Txt text={label} x={17} fill={index === 1 ? INK : MUTED} fontSize={17} fontWeight={index === 1 ? 700 : 520} fontFamily={'Inter, sans-serif'} />
              </Rect>
            ))}
          </Rect>
          <Txt text={'Feedback inbox'} x={-120} y={-278} fill={INK} fontSize={37} fontWeight={760} fontFamily={'Inter, sans-serif'} />
          <Rect x={475} y={-278} width={170} height={48} radius={16} fill={PURPLE}>
            <Txt text={'+ New insight'} fill={WHITE} fontSize={16} fontWeight={720} fontFamily={'Inter, sans-serif'} />
          </Rect>
          {productCards.map((ref, index) => (
            <Rect ref={ref} x={-50} y={-162 + index * 104} width={920} height={82} radius={18} fill={index === 2 ? '#f5ecff' : '#fbfafc'} stroke={index === 2 ? '#9d5ce44a' : '#d7cfe044'} lineWidth={2} opacity={0}>
              <Circle x={-408} size={42} fill={['#ffd4e7', '#d2f3ea', '#e7d5ff'][index % 3]}>
                <Txt text={String(index + 1)} fill={INK} fontSize={15} fontWeight={800} fontFamily={'Inter, sans-serif'} />
              </Circle>
              <Txt text={['Faster search for saved views', 'Export roadmap as a public page', 'Dark mode for embedded boards', 'Group feedback by account', 'Notify owners when status changes', 'Add score to duplicate requests'][index]} x={-76} width={620} textAlign={'left'} fill={INK} fontSize={18} fontWeight={610} fontFamily={'Inter, sans-serif'} />
              <Rect x={380} width={90} height={30} radius={15} fill={index < 2 ? '#dff8ed' : '#eee8f3'}>
                <Txt text={index < 2 ? 'HIGH' : 'OPEN'} fill={index < 2 ? '#167c5b' : MUTED} fontSize={11} fontWeight={820} fontFamily={'Inter, sans-serif'} />
              </Rect>
            </Rect>
          ))}
          <Rect ref={productFocus} x={70} y={46} width={940} height={101} radius={24} stroke={'#a855f7'} lineWidth={4} opacity={0} />
        </Rect>
        <Circle ref={productClick} size={40} stroke={'#8b5cf6'} lineWidth={4} fill={'#a855f722'} opacity={0} />
        <Path ref={productCursor} data={'M4 2v43l12-10 8 19 9-4-8-18h17L4 2Z'} fill={WHITE} stroke={INK} lineWidth={3} x={-320} y={330} scale={1.25} opacity={0} shadowColor={'#2b153c55'} shadowBlur={18} />
      </Layout>

      <Layout ref={roadmap} opacity={0}>
        <Txt ref={roadmapTitle} text={'Plan what matters next.'} y={-430} fill={INK} fontSize={76} fontWeight={760} letterSpacing={-3.6} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Rect ref={roadmapBoard} width={1580} height={800} y={95} radius={36} fill={'#ffffffd9'} stroke={'#8b5cf62e'} lineWidth={2} shadowColor={'#652b8150'} shadowBlur={75} opacity={0} scale={0.86} rotation={2} clip>
          {['Planned', 'In progress', 'Shipped'].map((label, index) => (
            <Rect ref={roadmapColumns[index]} x={-510 + index * 510} y={130} width={450} height={650} radius={24} fill={index === 1 ? '#f5edff' : '#f8f5fa'} opacity={0}>
              <Layout y={-275}>
                <Circle x={-168} size={15} fill={[MAGENTA, PURPLE, MINT][index]} />
                <Txt text={label} x={-80} fill={INK} fontSize={21} fontWeight={720} fontFamily={'Inter, sans-serif'} />
                <Rect x={160} width={42} height={28} radius={14} fill={'#e9e1ef'}><Txt text={String(index + 2)} fill={MUTED} fontSize={13} fontWeight={750} fontFamily={'Inter, sans-serif'} /></Rect>
              </Layout>
            </Rect>
          ))}
          {roadmapCards.map((ref, index) => {
            const column = index % 3;
            const row = Math.floor(index / 3);
            return (
              <Rect ref={ref} x={-510 + column * 510} y={-150 + row * 185} width={390} height={142} radius={20} fill={WHITE} stroke={'#9f8eaa33'} lineWidth={2} shadowColor={'#4b285018'} shadowBlur={24} opacity={0} scale={0.7} rotation={-4 + index}>
                <Rect x={-135} y={-43} width={72} height={24} radius={12} fill={['#ffe0ed', '#e8dcff', '#d9f6ee'][column]}><Txt text={['RESEARCH', 'BUILDING', 'LIVE'][column]} fill={INK} fontSize={9} fontWeight={850} fontFamily={'Inter, sans-serif'} /></Rect>
                <Txt text={['Segment by revenue', 'Public changelog', 'Voting portal', 'Duplicate detection', 'Custom domains', 'Smart summaries', 'Slack digest'][index]} x={-10} y={5} width={330} textAlign={'left'} fill={INK} fontSize={18} fontWeight={650} fontFamily={'Inter, sans-serif'} />
                <Circle x={142} y={48} size={24} fill={['#f4b7cf', '#bfeee2', '#d7c2f4'][index % 3]} />
              </Rect>
            );
          })}
        </Rect>
      </Layout>

      <Layout ref={updates} opacity={0}>
        <Txt ref={updatesTitle} text={'Publish progress,\nautomatically.'} x={-500} y={-170} width={820} fill={INK} fontSize={88} lineHeight={92} fontWeight={770} letterSpacing={-4.5} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Txt text={'Keep customers close without writing the same update twice.'} x={-525} y={105} width={720} fill={MUTED} fontSize={26} lineHeight={36} fontWeight={470} fontFamily={'Inter, sans-serif'} />
        {updateStack.map((ref, index) => (
          <Rect ref={ref} x={410 + index * 40} y={-120 + index * 80} width={760} height={250} radius={28} fill={index === 2 ? '#fff' : '#fbf6ff'} stroke={index === 2 ? '#9b5de544' : '#cbb9db38'} lineWidth={2} shadowColor={'#71359735'} shadowBlur={55} opacity={0} scale={0.72} rotation={-9 + index * 6}>
            <Rect x={-278} y={-78} width={110} height={30} radius={15} fill={index === 2 ? '#e6faf2' : '#f0e7f7'}><Txt text={index === 2 ? 'SHIPPED' : 'DRAFT'} fill={INK} fontSize={11} fontWeight={850} fontFamily={'Inter, sans-serif'} /></Rect>
            <Txt text={['Smarter feedback search', 'Roadmap filters for teams', 'Weekly signal digest'][index]} x={-35} y={-22} width={610} textAlign={'left'} fill={INK} fontSize={27} fontWeight={710} fontFamily={'Inter, sans-serif'} />
            <Rect x={-20} y={54} width={610} height={13} radius={7} fill={'#ddd4e35c'} />
            <Circle x={300} y={82} size={42} fill={['#ffd4e7', '#c6f2e8', '#e1d0f7'][index]} />
          </Rect>
        ))}
        <Line ref={updateTrace} points={[[80, 320], [280, 220], [455, 300], [650, 170]]} stroke={purpleGradient} lineWidth={5} end={0} lineDash={[10, 15]} />
        <Rect ref={updateBadge} x={655} y={170} width={210} height={58} radius={29} fill={MINT} opacity={0} scale={0.7}>
          <Txt text={'SYNCED · 12:04'} fill={INK} fontSize={14} fontWeight={820} letterSpacing={1.2} fontFamily={'Inter, sans-serif'} />
        </Rect>
      </Layout>

      <Layout ref={team} opacity={0}>
        <Txt ref={teamTitle} text={'Keep every team\nin the loop.'} x={-560} y={-130} width={780} fill={INK} fontSize={92} lineHeight={96} fontWeight={780} letterSpacing={-4.8} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Txt ref={teamTitleNext} text={'Everyone moves\ntogether.'} x={-525} y={-130} width={780} fill={INK} fontSize={92} lineHeight={96} fontWeight={780} letterSpacing={-4.8} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Layout ref={teamCore} x={410} scale={0.55} opacity={0}>
          <Circle size={390} fill={'#ffffffb5'} shadowColor={'#8b5cf644'} shadowBlur={65} />
          <LogoMark scale={0.88} />
        </Layout>
        <Circle ref={teamOrbit} x={410} size={720} stroke={'#ad73da70'} lineWidth={2} scale={0.55} opacity={0} />
        {[
          ['PM', '#f6bad2', 80, -340, -8],
          ['CS', '#bceee5', 780, -300, 7],
          ['ENG', '#d8c3f5', 815, 330, -5],
          ['GTM', '#ffe0a8', 95, 330, 6],
        ].map(([initials, color, x, y, rotation], index) => (
          <Layout ref={teamAvatars[index]} opacity={0} scale={0.45}>
            <Face initials={String(initials)} color={String(color)} x={Number(x)} y={Number(y)} rotation={Number(rotation)} />
          </Layout>
        ))}
        {[
          [[410, 0], [80, -340]], [[410, 0], [780, -300]], [[410, 0], [815, 330]], [[410, 0], [95, 330]],
        ].map((points, index) => <Line ref={teamLines[index]} points={points as [[number, number], [number, number]]} stroke={index % 2 ? '#7c3aed55' : '#db4fc455'} lineWidth={3} end={0} lineDash={[8, 13]} />)}
        <Diamond x={-770} y={320} size={26} color={MAGENTA} />
        <Diamond x={-670} y={-355} size={20} color={MINT} />
      </Layout>

      <Layout ref={cta} opacity={0}>
        <Circle size={920} x={-690} y={-450} fill={'#7c3aed22'} filters={[blur(80)]} />
        <Circle size={760} x={760} y={440} fill={'#db4fc41f'} filters={[blur(90)]} />
        <Layout ref={ctaLogo} y={-300} scale={0.4} opacity={0}>
          <LogoMark scale={0.68} />
        </Layout>
        <Txt ref={ctaTitle} text={'Build from signal,\nnot noise.'} y={-50} width={1450} textAlign={'center'} fill={WHITE} fontSize={118} lineHeight={120} fontWeight={790} letterSpacing={-5.8} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Txt ref={ctaSub} text={'A motion capability benchmark · original assets · open tooling'} y={235} fill={'#d9c7e8'} fontSize={24} fontWeight={480} fontFamily={'Inter, sans-serif'} opacity={0} />
        <Rect ref={ctaButton} y={340} width={420} height={78} radius={26} fill={WHITE} shadowColor={'#c084fc88'} shadowBlur={55} opacity={0} scale={0.65}>
          <Txt text={'EXPLORE SIGNALNEST'} fill={DARK} fontSize={17} fontWeight={850} letterSpacing={1.6} fontFamily={'Inter, sans-serif'} />
        </Rect>
        <Txt text={'Music: “Synth/bass Short or Intro” · griffon_designs · CC0 1.0'} y={505} fill={'#8f7aa0'} fontSize={12} fontFamily={'Inter, sans-serif'} />
      </Layout>

      <Path
        ref={transitionStar}
        data={'M0 -92 C20 -30 30 -20 92 0 C30 20 20 30 0 92 C-20 30 -30 20 -92 0 C-30 -20 -20 -30 0 -92Z'}
        fill={CREAM}
        opacity={0}
        scale={0.1}
        zIndex={100}
        shadowColor={'#d85bd9aa'}
        shadowBlur={55}
      />
    </>,
  );

  // Measure independent word nodes as rows; do not eyeball inter-word spacing.
  arrangeTextRow([introTitle, introIn], {gap: 42, centerX: 0});
  arrangeTextRow([introProduct, introSignals], {gap: 46, centerX: 0});
  const [statementAX, statementBX] = arrangeTextRow([statementA, statementB], {gap: 44, centerX: 65});
  statementA().x(statementAX - 90);
  statementB().x(statementBX + 90);

  // 0.0–4.5 — dark tension, procedural particles, delayed music entrance
  intro().opacity(1);
  yield* all(
    impactText(introTitle, {duration: 0.78, fromScale: 1.62, rotation: -2.5, blur: 13}),
    introHalo().scale(1, 1.1, easeOutCubic),
    introHalo().rotation(45, 1.1, easeInOutCubic),
  );
  yield* all(
    wordCascade([introIn, introProduct, introSignals], {stagger: 0.1, duration: 0.62, offset: 58, blur: 10}),
    gradientSweep(introSignals, 2.2, {colors: ['#7c3aed', '#f472d0', '#58d7c4', '#db4fc4', '#7c3aed']}),
    introSub().opacity(1, 0.45),
    introSub().y(300, 0.55, easeOutCubic),
    ...particles.map((particle, index) => all(
      particle().opacity(0.25 + seed(index, 11) * 0.55, 0.45),
      particle().position.x(particle().position.x() + (seed(index, 14) - 0.5) * 190, 2.6, easeInOutCubic),
      particle().position.y(particle().position.y() - 70 - seed(index, 16) * 150, 2.6, easeOutCubic),
      particle().scale(0.6 + seed(index, 19) * 1.3, 2.2, easeInOutCubic),
    )),
  );
  yield* waitFor(0.3);
  transitionStar().position([430, 80]);
  transitionStar().scale(0.12);
  transitionStar().rotation(0);
  transitionStar().opacity(1);
  yield* all(
    intro().opacity(0, 0.62),
    intro().scale(1.08, 0.8, easeInOutCubic),
    transitionStar().scale(20, 0.8, easeInBack),
    transitionStar().rotation(90, 0.8, easeInOutCubic),
  );

  // 4.5–8.0 — identity mark morphs into the brand
  lightBackground().opacity(1);
  glowLeft().opacity(0.7);
  glowRight().opacity(0.6);
  transitionStar().opacity(0);
  transitionStar().scale(0.1);
  markScene().opacity(1);
  yield* all(markWrap().scale(1, 0.7, easeOutBack), markWrap().rotation(0, 0.7, easeOutCubic), markRing().rotation(60, 0.7, easeInOutCubic));
  yield* all(trackReveal(markName, {duration: 0.72, fromTracking: 42, toTracking: -3.2, blur: 11}), markName().y(230, 0.72, easeOutCubic), markWrap().y(-45, 0.72, easeOutCubic));
  yield* waitFor(1.2);
  yield* all(markScene().opacity(0, 0.8), markScene().scale(1.35, 0.8, easeInBack));

  // 8.0–13.0 — kinetic signal cloud
  cloud().opacity(1);
  yield* all(
    trackReveal(cloudFocus, {duration: 0.9, fromTracking: 52, toTracking: -6, fromScale: 0.72, blur: 15}),
    ...cloudRefs.map((word, index) => all(
      word().opacity(0.28 + (index % 3) * 0.16, 0.45),
      word().position([cloudPositions[index][0], cloudPositions[index][1]], 1.1, easeOutCubic),
      word().filters.blur(1.4 + (index % 2) * 1.5, 1.1),
    )),
  );
  yield* all(cloud().rotation(-2, 2.7, easeInOutCubic), cloud().scale(1.08, 2.7, easeInOutCubic), glowLeft().x(-560, 2.7), glowRight().x(630, 2.7));
  yield* all(cloud().opacity(0, 1.2), cloud().scale(1.68, 1.2, easeInBack), cloud().rotation(4, 1.2, easeInOutCubic));

  // 13.0–17.0 — crisp positioning statement
  statement().opacity(1);
  yield* all(
    statementIcon().opacity(1, 0.45), statementIcon().scale(1, 0.8, easeOutBack),
    sequence(0.12,
      trackReveal(statementA, {duration: 0.72, fromTracking: 8, toTracking: -5, blur: 10}),
      trackReveal(statementB, {duration: 0.72, fromTracking: 11, toTracking: -5, blur: 12}),
    ),
    statementA().x(statementAX, 0.72, easeOutCubic),
    statementB().x(statementBX, 0.72, easeOutCubic),
  );
  yield* all(statementLine().start(0, 0.7, easeOutCubic), statementLine().end(1, 0.7, easeOutCubic), statementIcon().rotation(12, 0.7, easeInOutCubic));
  yield* waitFor(1.7);
  yield* all(statement().opacity(0, 0.8), statement().y(-55, 0.8, easeInOutCubic), statement().scale(1.18, 0.8, easeInBack), statementLine().rotation(8, 0.8, easeInOutCubic));

  // 17.0–22.0 — integrations orbit and settle around the core
  integrations().opacity(1);
  yield* all(integrationOrbit().opacity(1, 0.45), integrationOrbit().scale(1, 0.8, easeOutBack), integrationCore().opacity(1, 0.45), integrationCore().scale(1, 0.8, easeOutBack));
  yield* sequence(0.1, ...integrationPills.map(pill => all(pill().opacity(1, 0.35), pill().scale(1, 0.9, easeOutBack))));
  yield* all(typewriter(integrationCaption, 'One system. Every signal.', 0.9, {cursor: '▍'}), integrationOrbit().rotation(78, 1.5, easeInOutCubic), integrationCore().rotation(-12, 1.5, easeInOutCubic), ...integrationPills.map((pill, index) => pill().rotation((index % 2 ? 1 : -1) * 3, 1.5, easeInOutCubic)));
  yield* waitFor(0.5);
  yield* all(integrations().opacity(0, 0.8), integrations().scale(1.85, 0.8, easeInBack), integrationOrbit().rotation(145, 0.8, easeInOutCubic));

  // 22.0–26.0 — dark brand bridge with intentional music drop
  lightBackground().opacity(0);
  glowLeft().opacity(0);
  glowRight().opacity(0);
  view.fill(darkGradient);
  brandBreak().opacity(1);
  brandName().x(260);
  yield* all(brandLogo().opacity(1, 0.4), brandLogo().scale(1, 0.6, easeOutBack), trackReveal(brandName, {duration: 0.65, fromTracking: 48, toTracking: -5.5, blur: 13}), brandName().x(100, 0.65, easeOutCubic));
  yield* all(typewriter(brandTagline, 'CLARITY FOR PRODUCT TEAMS', 0.9, {cursor: '▍'}), brandRingA().scale(1, 1.3, easeOutCubic), brandRingA().rotation(35, 1.3), brandRingB().scale(1, 1.3, easeOutCubic), brandRingB().rotation(-28, 1.3));
  yield* waitFor(0.5);
  transitionStar().position([0, 0]);
  transitionStar().rotation(0);
  transitionStar().scale(0.1);
  transitionStar().opacity(1);
  yield* all(brandBreak().opacity(0, 0.72), brandBreak().scale(1.18, 0.8, easeInBack), transitionStar().scale(20, 0.8, easeInBack), transitionStar().rotation(-75, 0.8, easeInOutCubic));

  // 26.0–34.0 — procedural product UI, perspective camera, cursor and focus
  view.fill(DARK);
  lightBackground().opacity(1);
  glowLeft().opacity(0.65);
  glowRight().opacity(0.55);
  transitionStar().opacity(0);
  transitionStar().scale(0.1);
  product().opacity(1);
  yield* all(
    trackReveal(productEyebrow, {duration: 0.62, fromTracking: 13, toTracking: 3.8, fromScale: 0.94, blur: 7}),
    typewriter(productTitle, 'See what matters.\nMove with confidence.', 0.92, {cursor: '▍'}), productTitle().x(-390, 0.92, easeOutCubic),
    productFrame().opacity(1, 0.4), productFrame().scale(0.88, 1.2, easeOutBack), productFrame().rotation(-3, 1.2, easeOutCubic), productFrame().skew.y(-5, 1.2, easeOutCubic), productFrame().position([265, 110], 1.2, easeOutCubic),
  );
  yield* sequence(0.12, ...productCards.map(card => all(card().opacity(1, 0.28), card().x(70, 0.68, easeOutCubic))));
  yield* all(productCursor().opacity(1, 0.2), productCursor().position([510, 155], 1.2, easeInOutCubic));
  productClick().position(productCursor().position());
  yield* all(productClick().opacity(1, 0.08), productClick().scale(3.4, 0.4, easeOutCubic), productCursor().scale(0.82, 0.08).to(1.25, 0.18), productFocus().opacity(1, 0.28));
  yield* all(productFrame().scale(1.01, 1.0, easeInOutCubic), productFrame().x(210, 1.0, easeInOutCubic), productTitle().x(-455, 1.0, easeInOutCubic));
  yield* waitFor(1.8);
  yield* all(product().opacity(0, 1.0), product().x(-120, 1.0, easeInBack), productFrame().scale(1.48, 1.0, easeInBack), productFrame().rotation(0, 1.0, easeInOutCubic));

  // 34.0–40.0 — roadmap assembles from columns to cards
  roadmap().opacity(1);
  yield* all(trackReveal(roadmapTitle, {duration: 0.72, fromTracking: 38, toTracking: -3.6, blur: 11}), roadmapTitle().y(-445, 0.72, easeOutCubic), roadmapBoard().opacity(1, 0.4), roadmapBoard().scale(1, 0.7, easeOutBack));
  yield* sequence(0.12, ...roadmapColumns.map(column => all(column().opacity(1, 0.3), column().y(30, 0.75, easeOutCubic))));
  yield* sequence(0.08, ...roadmapCards.map(card => all(card().opacity(1, 0.25), card().scale(1, 0.65, easeOutBack), card().rotation(0, 0.65, easeOutCubic))));
  yield* all(roadmapBoard().rotation(-1.2, 1.4, easeInOutCubic), roadmapBoard().scale(1.035, 1.4, easeInOutCubic), roadmapBoard().y(70, 1.4, easeInOutCubic));
  yield* waitFor(1.4);
  yield* all(roadmap().opacity(0, 1.0), roadmap().scale(1.32, 1.0, easeInBack), roadmap().y(-130, 1.0, easeInBack), roadmapBoard().rotation(2.5, 1.0, easeInOutCubic));

  // 40.0–46.0 — update cards and a visible automation trace
  updates().opacity(1);
  yield* all(typewriter(updatesTitle, 'Publish progress,\nautomatically.', 0.9, {cursor: '▍'}), updatesTitle().x(-465, 0.9, easeOutCubic));
  yield* sequence(0.16, ...updateStack.map(card => all(card().opacity(1, 0.35), card().scale(1, 0.8, easeOutBack), card().rotation(0, 0.8, easeOutCubic))));
  yield* all(updateTrace().end(1, 1.1, easeInOutCubic), updateBadge().opacity(1, 0.25), updateBadge().scale(1, 0.7, easeOutBack));
  yield* all(updateBadge().x(675, 0.5, easeOutCubic), eraseAndType(updatesTitle, 'Ship updates\nwith confidence.', 0.7, {cursor: '▍', eraseFraction: 0.34}));
  yield* waitFor(0.9);
  yield* all(updates().opacity(0, 1.0), updates().y(-110, 1.0, easeInBack), updates().scale(1.14, 1.0, easeInBack), updateTrace().scale(1.8, 1.0, easeInOutCubic));

  // 46.0–52.0 — team network, orbiting avatars, connected particles
  team().opacity(1);
  yield* all(typewriter(teamTitle, 'Keep every team\nin the loop.', 0.85, {cursor: '▍'}), teamTitle().x(-525, 0.85, easeOutCubic), teamCore().opacity(1, 0.4), teamCore().scale(1, 0.7, easeOutBack), teamOrbit().opacity(1, 0.35), teamOrbit().scale(1, 0.7, easeOutBack));
  yield* sequence(0.13, ...teamAvatars.map(avatar => all(avatar().opacity(1, 0.3), avatar().scale(1, 0.9, easeOutBack))));
  yield* all(...teamLines.map(line => line().end(1, 1.1, easeInOutCubic)));
  yield* all(pushText(teamTitle, teamTitleNext, 0.85, {axis: 'y', distance: 260, direction: 1, blur: 8}), teamOrbit().rotation(60, 1.4, easeInOutCubic), teamCore().rotation(-9, 1.4, easeInOutCubic), ...teamAvatars.map((avatar, index) => avatar().rotation((index % 2 ? 1 : -1) * 4, 1.4, easeInOutCubic)));
  yield* waitFor(0.15);
  yield* all(team().opacity(0, 1.0), team().scale(1.42, 1.0, easeInBack), team().x(-80, 1.0, easeInBack));

  // 52.0–56.0 — dark CTA and controlled music fade
  lightBackground().opacity(0);
  glowLeft().opacity(0);
  glowRight().opacity(0);
  view.fill(darkGradient);
  cta().opacity(1);
  yield* all(ctaLogo().opacity(1, 0.35), ctaLogo().scale(1, 0.7, easeOutBack), trackReveal(ctaTitle, {duration: 0.78, fromTracking: 34, toTracking: -5.8, fromScale: 0.88, blur: 15}), ctaTitle().y(-65, 0.78, easeOutCubic));
  yield* all(typewriter(ctaSub, 'A motion capability benchmark · original assets · open tooling', 0.82, {cursor: '▍'}), ctaSub().y(225, 0.82, easeOutCubic), ctaButton().opacity(1, 0.35), ctaButton().scale(1, 0.8, easeOutBack));
  // Hold the finished lockup long enough for the full film to land at 56 seconds.
  yield* waitFor(2.2);
  yield* all(cta().opacity(0, 0.7), cta().scale(1.04, 0.7, easeInOutCubic));
});
