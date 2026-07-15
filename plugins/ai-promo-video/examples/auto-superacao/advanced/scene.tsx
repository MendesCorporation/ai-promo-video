/** @jsxImportSource @revideo/2d/lib */
import {
  Circle,
  Gradient,
  Layout,
  Line,
  Rect,
  Txt,
  Video,
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
  impactText,
  pushText,
  trackReveal,
  wordCascade,
} from './kinetic';

const INK = '#05070b';
const NIGHT = '#090d15';
const WHITE = '#f6f7f2';
const MUTED = '#a7afbd';
const ICE = '#9ed8df';
const AMBER = '#ffb55e';
const FONT = 'Helvetica Neue, Inter, sans-serif';

const sunrise = new Gradient({
  type: 'linear',
  from: [-420, 0],
  to: [420, 0],
  stops: [
    {offset: 0, color: '#f6f7f2'},
    {offset: 0.42, color: '#ffe0a8'},
    {offset: 1, color: '#ff8b56'},
  ],
});

const seed = (index: number, salt = 0) => {
  const value = Math.sin((index + 1) * 19.198 + salt * 91.77) * 9271.331;
  return value - Math.floor(value);
};

export default makeScene2D('ainda-auto-superacao', function* (view) {
  view.fill(INK);

  const atmosphere = createRef<Layout>();
  const glow = createRef<Circle>();
  const horizon = createRef<Line>();

  const prologue = createRef<Layout>();
  const prologueTitle = createRef<Txt>();
  const prologueSubtitle = createRef<Txt>();
  const prologueRule = createRef<Line>();

  const memory = createRef<Layout>();
  const memoryFrame = createRef<Rect>();
  const vintage = createRef<Video>();
  const memoryKicker = createRef<Txt>();
  const memoryLineA = createRef<Txt>();
  const memoryLineB = createRef<Txt>();
  const filmEdge = createRef<Line>();

  const effort = createRef<Layout>();
  const training = createRef<Video>();
  const effortShade = createRef<Rect>();
  const weight = createRef<Txt>();
  const fear = createRef<Txt>();
  const silence = createRef<Txt>();
  const effortCaption = createRef<Txt>();
  const effortCounter = createRef<Txt>();

  const ascent = createRef<Layout>();
  const climb = createRef<Video>();
  const ascentFrame = createRef<Rect>();
  const ascentShade = createRef<Rect>();
  const ascentLead = createRef<Txt>();
  const ascentImpact = createRef<Txt>();
  const nextStep = createRef<Txt>();
  const path = createRef<Line>();
  const pathPulse = createRef<Circle>();

  const reflection = createRef<Layout>();
  const mountain = createRef<Video>();
  const reflectionShade = createRef<Rect>();
  const reflectionCard = createRef<Rect>();
  const reflectionRule = createRef<Line>();
  const reflectionWords = [
    createRef<Txt>(), createRef<Txt>(), createRef<Txt>(),
    createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(),
  ];
  const reflectionLine = createRef<Txt>();

  const release = createRef<Layout>();
  const lightVideo = createRef<Video>();
  const releaseShade = createRef<Rect>();
  const continued = createRef<Txt>();
  const changed = createRef<Txt>();
  const sunRing = createRef<Circle>();

  const finale = createRef<Layout>();
  const finaleTitle = createRef<Txt>();
  const finaleSub = createRef<Txt>();
  const finaleCredit = createRef<Txt>();

  const transitionBlade = createRef<Rect>();
  const flash = createRef<Rect>();

  view.add(
    <>
      <Layout ref={atmosphere}>
        <Circle ref={glow} size={980} x={-720} y={-430} fill={'#354d6a31'} filters={[blur(150)]} />
        <Circle size={760} x={860} y={520} fill={'#b4683b18'} filters={[blur(150)]} />
        {Array.from({length: 52}, (_, index) => (
          <Circle
            size={2 + seed(index, 1) * 5}
            x={-930 + seed(index, 2) * 1860}
            y={-520 + seed(index, 3) * 1040}
            fill={index % 7 === 0 ? '#ffba6f99' : '#d8e2ee55'}
            opacity={0.12 + seed(index, 4) * 0.42}
            filters={[blur(seed(index, 5) * 1.4)]}
          />
        ))}
        <Line ref={horizon} points={[[-960, 390], [-560, 305], [-180, 350], [240, 250], [660, 300], [960, 210]]} stroke={'#b9c7d42c'} lineWidth={2} end={0} />
      </Layout>

      <Layout ref={prologue} opacity={0}>
        <Txt text={'UM FILME SOBRE CONTINUAR'} y={-235} fill={'#8f9aab'} fontSize={17} fontWeight={720} letterSpacing={5.8} fontFamily={FONT} />
        <Txt ref={prologueTitle} text={'AINDA'} fill={WHITE} fontSize={210} fontWeight={760} letterSpacing={-10} fontFamily={FONT} opacity={0} />
        <Line ref={prologueRule} points={[[-36, 160], [36, 160]]} stroke={AMBER} lineWidth={4} lineCap={'round'} start={0.5} end={0.5} />
        <Txt ref={prologueSubtitle} text={'Às vezes, coragem só parece um passo a mais.'} y={235} fill={MUTED} fontSize={29} fontWeight={430} fontFamily={FONT} opacity={0} />
      </Layout>

      <Layout ref={memory} opacity={0}>
        <Rect ref={memoryFrame} x={280} width={1240} height={760} radius={26} clip shadowColor={'#000000dd'} shadowBlur={90} scale={0.68} rotation={-3}>
          <Video ref={vintage} src={'vintage-athlete.mp4'} width={1350} height={760} decoder={'web'} />
          <Rect width={1240} height={760} fill={'#0a11152f'} />
          <Line ref={filmEdge} points={[[0, -380], [0, 380]]} x={-380} stroke={'#fff8ddaa'} lineWidth={3} opacity={0.3} />
        </Rect>
        <Rect x={-660} y={-350} width={250} height={42} radius={21} fill={'#f3c98712'} stroke={'#f3c9874d'} lineWidth={1}>
          <Txt ref={memoryKicker} text={'1891  ·  O MESMO GESTO'} fill={'#eed9b0'} fontSize={14} fontWeight={760} letterSpacing={2.3} fontFamily={FONT} opacity={0} />
        </Rect>
        <Txt ref={memoryLineA} text={'Ninguém vê'} x={-545} y={-105} width={650} textAlign={'left'} fill={WHITE} fontSize={104} fontWeight={730} letterSpacing={-5.2} fontFamily={FONT} opacity={0} />
        <Txt ref={memoryLineB} text={'quantas vezes\nvocê quase parou.'} x={-505} y={95} width={720} textAlign={'left'} fill={'#c7ced8'} fontSize={48} lineHeight={58} fontWeight={500} letterSpacing={-1.7} fontFamily={FONT} opacity={0} />
      </Layout>

      <Layout ref={effort} opacity={0}>
        <Video ref={training} src={'training.mp4'} width={1980} height={1114} decoder={'web'} />
        <Rect ref={effortShade} width={1920} height={1080} fill={'#080b12a6'} />
        <Rect width={1920} height={1080} fill={'#25324933'} />
        <Txt ref={effortCounter} text={'03:17  /  NINGUÉM ESTÁ OLHANDO'} x={-650} y={-455} fill={'#cad4e2'} fontSize={15} fontWeight={700} letterSpacing={3.2} fontFamily={FONT} opacity={0} />
        <Txt ref={weight} text={'O peso.'} fill={WHITE} fontSize={156} fontWeight={760} letterSpacing={-8} fontFamily={FONT} opacity={0} />
        <Txt ref={fear} text={'O medo.'} fill={WHITE} fontSize={156} fontWeight={760} letterSpacing={-8} fontFamily={FONT} opacity={0} />
        <Txt ref={silence} text={'O silêncio.'} fill={sunrise} fontSize={156} fontWeight={760} letterSpacing={-8} fontFamily={FONT} opacity={0} />
        <Txt ref={effortCaption} text={'que ninguém podia carregar por você.'} y={235} fill={'#d5d9df'} fontSize={30} fontWeight={450} fontFamily={FONT} opacity={0} />
      </Layout>

      <Layout ref={ascent} opacity={0}>
        <Rect ref={ascentFrame} width={1680} height={920} radius={34} clip shadowColor={'#000000e8'} shadowBlur={105} scale={0.76} rotation={3}>
          <Video ref={climb} src={'climb.mp4'} width={1745} height={982} decoder={'web'} />
          <Rect ref={ascentShade} width={1680} height={920} fill={'#06101875'} />
        </Rect>
        <Txt ref={ascentLead} text={'Mas ainda havia'} x={-540} y={-310} width={700} textAlign={'left'} fill={'#dce5e8'} fontSize={42} fontWeight={520} fontFamily={FONT} opacity={0} />
        <Txt ref={ascentImpact} text={'UM PASSO.'} x={-350} y={-130} width={1080} textAlign={'left'} fill={WHITE} fontSize={142} fontWeight={790} letterSpacing={-7.5} fontFamily={FONT} opacity={0} />
        <Line ref={path} points={[[-690, 310], [-430, 250], [-190, 315], [90, 180], [380, 230], [690, 55]]} stroke={'#bcecf0c7'} lineWidth={4} lineCap={'round'} end={0} />
        <Circle ref={pathPulse} size={22} x={-690} y={310} fill={ICE} shadowColor={ICE} shadowBlur={35} opacity={0} />
        <Txt ref={nextStep} text={'depois outro.'} x={560} y={350} fill={'#d7e7e9'} fontSize={35} fontWeight={540} fontFamily={FONT} opacity={0} />
      </Layout>

      <Layout ref={reflection} opacity={0}>
        <Video ref={mountain} src={'mountain.mp4'} width={1940} height={1091} decoder={'web'} />
        <Rect ref={reflectionShade} width={1920} height={1080} fill={'#060a10b0'} />
        <Rect ref={reflectionCard} width={1540} height={620} radius={42} fill={'#0a111ab8'} stroke={'#d7e5ee20'} lineWidth={2} shadowColor={'#000000bb'} shadowBlur={80} opacity={0} scale={0.965} />
        <Layout y={-75}>
          {['Você', 'não', 'ficou', 'mais', 'forte', 'de', 'uma vez.'].map((word, index) => (
            <Txt
              ref={reflectionWords[index]}
              text={word}
              x={[-560, -350, -135, 135, 365, 535, 665][index]}
              fill={word === 'forte' ? sunrise : WHITE}
              fontSize={index === 6 ? 74 : 78}
              fontWeight={word === 'forte' ? 760 : 650}
              letterSpacing={-3.2}
              fontFamily={FONT}
              opacity={0}
            />
          ))}
        </Layout>
        <Line ref={reflectionRule} points={[[-610, 75], [610, 75]]} stroke={'#ffffff2b'} lineWidth={2} end={0} opacity={0} />
        <Txt ref={reflectionLine} text={'Você ficou mais forte a cada vez que voltou.'} y={170} fill={'#cbd3dc'} fontSize={37} fontWeight={470} fontFamily={FONT} opacity={0} />
      </Layout>

      <Layout ref={release} opacity={0}>
        <Video ref={lightVideo} src={'ascent-to-light.mp4'} width={2000} height={1125} decoder={'web'} />
        <Rect ref={releaseShade} width={1920} height={1080} fill={'#071018a3'} />
        <Circle ref={sunRing} size={660} x={520} y={90} stroke={'#ffd28b4f'} lineWidth={3} scale={0.5} opacity={0} />
        <Txt ref={continued} text={'Você continuou.'} x={-80} y={40} width={1260} textAlign={'left'} fill={WHITE} fontSize={136} fontWeight={790} letterSpacing={-7.6} fontFamily={FONT} opacity={0} shadowColor={'#000000cc'} shadowBlur={38} />
        <Txt ref={changed} text={'E isso mudou tudo.'} x={-80} y={45} width={1280} textAlign={'left'} fill={sunrise} fontSize={130} fontWeight={770} letterSpacing={-7.1} fontFamily={FONT} opacity={0} shadowColor={'#000000cc'} shadowBlur={38} />
      </Layout>

      <Layout ref={finale} opacity={0}>
        <Circle size={840} y={200} fill={'#d9894130'} filters={[blur(170)]} />
        <Circle size={620} y={360} fill={'#ffd89622'} filters={[blur(130)]} />
        <Txt ref={finaleTitle} text={'CONTINUE.'} y={-35} fill={sunrise} fontSize={190} fontWeight={800} letterSpacing={-8.5} fontFamily={FONT} opacity={0} />
        <Txt ref={finaleSub} text={'Um passo ainda é um passo.'} y={170} fill={'#d6dce4'} fontSize={34} fontWeight={470} fontFamily={FONT} opacity={0} />
        <Txt ref={finaleCredit} text={'MÍDIA: WIKIMEDIA COMMONS  ·  TRILHA: “BETTER LIFE” — MAGMI.SOUNDTRACKS · CC BY 4.0'} y={480} fill={'#778293'} fontSize={14} fontWeight={600} letterSpacing={1.6} fontFamily={FONT} opacity={0} />
      </Layout>

      <Rect ref={transitionBlade} width={700} height={1500} x={-1350} rotation={18} fill={'#f1d7a5'} opacity={0} zIndex={100} />
      <Rect ref={flash} width={1920} height={1080} fill={WHITE} opacity={0} zIndex={110} />
    </>,
  );

  // The words animate independently, but settle as one optically measured sentence.
  arrangeTextRow(reflectionWords, {gap: 26, centerX: 0});

  // 0.0–5.0 — A quiet thesis. The world is almost black and breathing.
  prologue().opacity(1);
  yield* all(
    trackReveal(prologueTitle, {duration: 1.05, fromTracking: 48, toTracking: -10, fromScale: 0.86, blur: 14}),
    horizon().end(1, 1.4, easeInOutCubic),
    glow().position([-630, -365], 2.4, easeInOutCubic),
    atmosphere().scale(1.025, 1.6, easeInOutCubic),
  );
  yield* all(
    prologueRule().start(0, 0.55, easeOutCubic),
    prologueRule().end(1, 0.55, easeOutCubic),
    prologueSubtitle().opacity(1, 0.7),
    prologueSubtitle().y(220, 0.8, easeOutCubic),
  );
  yield* waitFor(1.15);
  yield* all(prologue().opacity(0, 0.85), prologue().scale(1.06, 0.85, easeInBack));

  // 5.0–12.9 — History becomes intimate: effort has always looked this lonely.
  memory().opacity(1);
  vintage().play();
  yield* all(
    memoryFrame().scale(1, 0.95, easeOutBack),
    memoryFrame().rotation(0, 0.95, easeOutCubic),
    memoryKicker().opacity(1, 0.55),
    trackReveal(memoryLineA, {duration: 0.8, fromTracking: 24, toTracking: -5.2, blur: 10}),
  );
  yield* all(
    memoryLineB().opacity(1, 0.75),
    memoryLineB().x(-485, 0.8, easeOutCubic),
    filmEdge().x(430, 2.2, easeInOutCubic),
    memoryFrame().scale(1.05, 2.5, easeInOutCubic),
    memoryFrame().x(235, 2.5, easeInOutCubic),
  );
  yield* waitFor(2.0);
  transitionBlade().opacity(1);
  yield* all(
    transitionBlade().x(1350, 0.7, easeInOutCubic),
    memory().x(-90, 0.7, easeInBack),
    memory().opacity(0, 0.62),
  );
  transitionBlade().opacity(0);

  // 12.9–22.6 — Physical effort, with words pushing each other like resistance.
  effort().opacity(1);
  training().play();
  fear().opacity(0);
  silence().opacity(0);
  yield* all(
    effort().scale(1.04, 0).to(1, 0.65, easeOutCubic),
    effortCounter().opacity(1, 0.5),
    impactText(weight, {duration: 0.65, fromScale: 1.5, rotation: -2, blur: 14}),
    effortShade().opacity(0.82, 0.65),
  );
  yield* waitFor(1.15);
  yield* pushText(weight, fear, 0.62, {distance: 1120, direction: 1, blur: 11});
  yield* waitFor(1.15);
  yield* pushText(fear, silence, 0.62, {distance: 1120, direction: 1, blur: 11});
  yield* waitFor(1.15);
  yield* all(
    effortCaption().opacity(1, 0.6),
    effortCaption().y(215, 0.65, easeOutCubic),
    effortShade().opacity(0.6, 1.8),
    effort().scale(1.055, 2.4, easeInOutCubic),
  );
  yield* waitFor(1.5);
  yield* all(effort().opacity(0, 0.8), effort().scale(1.1, 0.8, easeInBack), flash().opacity(0.32, 0.08).to(0, 0.52));

  // 22.6–34.4 — The camera attaches to the climb and follows the idea of one more step.
  ascent().opacity(1);
  climb().play();
  yield* all(
    ascentFrame().scale(1, 0.95, easeOutBack),
    ascentFrame().rotation(-1.2, 0.95, easeOutCubic),
    ascentLead().opacity(1, 0.55),
    ascentLead().x(-520, 0.7, easeOutCubic),
  );
  yield* impactText(ascentImpact, {duration: 0.72, fromScale: 1.52, rotation: -2.2, blur: 15});
  yield* waitFor(2.55);
  yield* all(
    ascentImpact().opacity(0, 0.6),
    ascentLead().opacity(0, 0.45),
    ascentFrame().scale(1.18, 2.1, easeInOutCubic),
    ascentFrame().rotation(1.1, 2.1, easeInOutCubic),
    ascentFrame().position([-110, 45], 2.1, easeInOutCubic),
    path().end(1, 2.05, easeInOutCubic),
    pathPulse().opacity(1, 0.25),
    pathPulse().position([690, 55], 2.05, easeInOutCubic),
    trackReveal(nextStep, {duration: 0.75, fromTracking: 18, toTracking: 0, blur: 8}),
  );
  yield* all(
    ascentFrame().scale(1.28, 2.9, easeInOutCubic),
    ascentFrame().position([-190, -25], 2.9, easeInOutCubic),
    path().opacity(0.18, 1.4),
    pathPulse().scale(2.2, 0.7, easeOutCubic),
    pathPulse().opacity(0, 0.8),
  );
  yield* waitFor(1.3);
  yield* all(ascent().opacity(0, 0.8), ascent().x(-100, 0.8, easeInBack));

  // 34.4–45.2 — The insight arrives with the card instead of after an empty hold.
  reflection().opacity(1);
  mountain().play();
  yield* all(
    reflectionShade().opacity(0.72, 0.45),
    reflection().scale(1.004, 0.45, easeInOutCubic),
  );
  yield* all(
    reflectionCard().opacity(1, 0.38, easeOutCubic),
    reflectionCard().scale(1, 0.68, easeOutBack),
    reflectionRule().opacity(1, 0.42, easeOutCubic),
    reflectionRule().end(1, 0.78, easeOutCubic),
    reflection().scale(1.012, 1.07, easeInOutCubic),
    wordCascade(reflectionWords, {stagger: 0.075, duration: 0.62, offset: 55, blur: 10, fromScale: 0.82}),
  );
  yield* all(
    waitFor(3.6),
    reflection().scale(1.027, 3.6, easeInOutCubic),
  );
  yield* all(
    reflectionLine().opacity(1, 0.75),
    reflectionLine().y(150, 0.8, easeOutCubic),
    reflectionShade().opacity(0.57, 2.6),
    reflection().scale(1.04, 2.6, easeInOutCubic),
  );
  yield* all(
    waitFor(5.45),
    reflection().scale(1.065, 5.45, easeInOutCubic),
  );
  flash().fill('#d9f2f2');
  yield* all(reflection().opacity(0, 0.78), reflection().scale(1.08, 0.78, easeInBack), flash().opacity(0.24, 0.1).to(0, 0.55));

  // 45.2–55.4 — Light is earned, not decorative. The frame keeps moving toward it.
  release().opacity(1);
  lightVideo().play();
  yield* all(
    release().scale(1.07, 0).to(1, 0.8, easeOutCubic),
    releaseShade().opacity(0.76, 0.8),
    sunRing().opacity(1, 0.65),
    sunRing().scale(1, 1.3, easeOutBack),
    impactText(continued, {duration: 0.82, fromScale: 1.42, rotation: -1.5, blur: 16}),
  );
  yield* all(
    release().scale(1.095, 4.6, easeInOutCubic),
    release().position([-45, -25], 4.6, easeInOutCubic),
    sunRing().scale(1.16, 4.6, easeInOutCubic),
    sunRing().opacity(0.45, 4.6),
    releaseShade().opacity(0.5, 4.6),
  );
  yield* pushText(continued, changed, 0.8, {distance: 1220, direction: 1, blur: 12});
  yield* waitFor(2.25);
  yield* all(release().opacity(0, 0.75), release().scale(1.14, 0.75, easeInBack));

  // 55.4–60.4 — One final instruction, held long enough to land.
  finale().opacity(1);
  yield* all(
    impactText(finaleTitle, {duration: 0.85, fromScale: 1.55, rotation: -2, blur: 18}),
    atmosphere().opacity(0.32, 1.2),
  );
  yield* all(
    finaleSub().opacity(1, 0.6),
    finaleSub().y(150, 0.7, easeOutCubic),
    finaleCredit().opacity(1, 0.65),
  );
  yield* waitFor(2.55);
  yield* all(finale().opacity(0, 0.55), finale().scale(1.035, 0.55, easeInOutCubic));
});
