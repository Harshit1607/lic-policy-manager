import React from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

export type IllustrationName = 'welcome' | 'allClear' | 'noResults' | 'people' | 'documents' | 'calendar';

const K = colors.black;
const W = colors.white;
const G1 = colors.surfaceMuted;

/** A single leaf, filled black or outlined, with a midrib line. */
function Leaf({ x, y, angle, scale = 1, filled }: { x: number; y: number; angle: number; scale?: number; filled: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <Path d="M0 0C8-10 22-12 34-6 24 4 10 8 0 0Z" fill={filled ? K : W} stroke={K} strokeWidth={1.4} />
      <Path d="M2 -1C12-4 22-5 31-6" stroke={filled ? W : K} strokeWidth={1} fill="none" />
    </G>
  );
}

/** A small potted-plant cluster in the style of the reference line-art. */
function Plant({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const s = flip ? -1 : 1;
  return (
    <G transform={`translate(${x} ${y}) scale(${s} 1)`}>
      <Leaf x={0} y={0} angle={-100} filled />
      <Leaf x={0} y={0} angle={-140} scale={0.9} filled={false} />
      <Leaf x={0} y={0} angle={-60} scale={0.85} filled={false} />
      <Leaf x={0} y={-6} angle={-165} scale={0.7} filled />
      <Leaf x={0} y={-6} angle={-20} scale={0.7} filled />
    </G>
  );
}

function Ground() {
  return <Path d="M20 168H220" stroke={K} strokeWidth={1.6} strokeLinecap="round" />;
}

function Welcome() {
  return (
    <>
      <Path d="M30 40c30-24 60 10 90-8s70-20 90 4" stroke={K} strokeWidth={1.2} fill="none" />
      {/* umbrella canopy */}
      <Path d="M58 92a62 50 0 0 1 124 0c-10-8-21-8-31 0-10-8-21-8-31 0-10-8-21-8-31 0-10-8-21-8-31 0Z" fill={K} />
      <Path d="M89 92c4-26 13-42 31-50M151 92c-4-26-13-42-31-50" stroke={W} strokeWidth={1.4} fill="none" />
      <Path d="M120 42V36" stroke={K} strokeWidth={3} strokeLinecap="round" />
      <Path d="M120 92v58c0 8 10 8 10 0" stroke={K} strokeWidth={3} fill="none" strokeLinecap="round" />
      {/* family house under the umbrella */}
      <Path d="M86 168v-40l26-20 26 20v40Z" fill={W} stroke={K} strokeWidth={2} strokeLinejoin="round" />
      <Rect x={104} y={142} width={16} height={26} fill={K} />
      <Rect x={93} y={128} width={10} height={10} fill={W} stroke={K} strokeWidth={1.6} />
      <Path d="M80 132l32-26 32 26" stroke={K} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Plant x={48} y={168} />
      <Plant x={192} y={168} flip />
      <Ground />
    </>
  );
}

function AllClear() {
  return (
    <>
      <Path d="M24 54c26-22 56 8 84-6s56-18 76 2 30 6 36-4" stroke={K} strokeWidth={1.2} fill="none" />
      {/* stacked receipts */}
      <Rect x={86} y={66} width={70} height={92} rx={6} fill={K} transform="rotate(-8 121 112)" />
      <Rect x={84} y={62} width={70} height={96} rx={6} fill={W} stroke={K} strokeWidth={2} />
      <Path d="M96 82h46M96 94h46M96 106h30M96 118h40" stroke={K} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={150} cy={140} r={22} fill={K} />
      <Path d="m140 140 7 7 13-14" stroke={W} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Plant x={52} y={168} />
      <Plant x={196} y={168} flip />
      <Ground />
    </>
  );
}

function NoResults() {
  return (
    <>
      <Rect x={70} y={50} width={80} height={104} rx={6} fill={W} stroke={K} strokeWidth={2} />
      <Path d="M82 70h56M82 84h56M82 98h36" stroke={G1} strokeWidth={6} strokeLinecap="round" />
      <Path d="M82 70h56M82 84h56M82 98h36" stroke={K} strokeWidth={1.2} strokeLinecap="round" strokeDasharray="3 4" />
      <Circle cx={150} cy={118} r={26} fill={W} stroke={K} strokeWidth={5} />
      <Path d="m169 137 20 20" stroke={K} strokeWidth={9} strokeLinecap="round" />
      <Path d="M140 110l20 16M160 110l-20 16" stroke={K} strokeWidth={3} strokeLinecap="round" />
      <Plant x={46} y={168} />
      <Ground />
    </>
  );
}

function People() {
  return (
    <>
      <Path d="M28 46c24-18 52 8 78-4s58-20 80 0 26 8 32 0" stroke={K} strokeWidth={1.2} fill="none" />
      {/* back figure: outlined */}
      <Circle cx={142} cy={86} r={20} fill={W} stroke={K} strokeWidth={2} />
      <Path d="M106 168c2-30 16-46 36-46s34 16 36 46Z" fill={W} stroke={K} strokeWidth={2} strokeLinejoin="round" />
      {/* front figure: filled */}
      <Circle cx={100} cy={96} r={22} fill={K} />
      <Path d="M60 168c2-32 18-50 40-50s38 18 40 50Z" fill={K} />
      <Path d="M92 130l8 10 8-10" stroke={W} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Plant x={40} y={168} />
      <Plant x={204} y={168} flip />
      <Ground />
    </>
  );
}

function Documents() {
  return (
    <>
      <Path d="M30 48c22-20 54 6 80-6s60-18 82 0 24 6 28-2" stroke={K} strokeWidth={1.2} fill="none" />
      <Rect x={64} y={70} width={64} height={86} rx={6} fill={K} />
      <Path d="M76 92h40M76 104h40M76 116h26" stroke={W} strokeWidth={2} strokeLinecap="round" />
      <Rect x={112} y={60} width={64} height={96} rx={6} fill={W} stroke={K} strokeWidth={2} />
      <Path d="M124 80h40M124 92h40M124 104h28" stroke={K} strokeWidth={2} strokeLinecap="round" />
      <Ellipse cx={144} cy={134} rx={14} ry={14} fill={W} stroke={K} strokeWidth={2} />
      <Path d="M139 128h10M139 133h10M143 133c4 0 6 2 6 4s-2 4-6 4l7 6" stroke={K} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Plant x={44} y={168} />
      <Plant x={200} y={168} flip />
      <Ground />
    </>
  );
}

function Calendar() {
  return (
    <>
      <Path d="M26 50c24-20 56 6 82-6s58-18 80 0 26 6 30-2" stroke={K} strokeWidth={1.2} fill="none" />
      {/* calendar page */}
      <Rect x={62} y={62} width={92} height={96} rx={8} fill={W} stroke={K} strokeWidth={2} />
      <Path d="M62 70a8 8 0 0 1 8-8h76a8 8 0 0 1 8 8v14H62Z" fill={K} />
      <Path d="M82 54v16M134 54v16" stroke={K} strokeWidth={4} strokeLinecap="round" />
      <Rect x={74} y={96} width={14} height={12} rx={2} fill={G1} stroke={K} strokeWidth={1.2} />
      <Rect x={94} y={96} width={14} height={12} rx={2} fill={K} />
      <Rect x={114} y={96} width={14} height={12} rx={2} fill={G1} stroke={K} strokeWidth={1.2} />
      <Rect x={74} y={116} width={14} height={12} rx={2} fill={G1} stroke={K} strokeWidth={1.2} />
      <Rect x={94} y={116} width={14} height={12} rx={2} fill={G1} stroke={K} strokeWidth={1.2} />
      {/* clock */}
      <Circle cx={156} cy={136} r={24} fill={K} />
      <Circle cx={156} cy={136} r={18} fill={W} />
      <Path d="M156 124v12l8 6" stroke={K} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Plant x={44} y={168} />
      <Plant x={202} y={168} flip />
      <Ground />
    </>
  );
}

const ART: Record<IllustrationName, () => React.JSX.Element> = {
  calendar: Calendar,
  welcome: Welcome,
  allClear: AllClear,
  noResults: NoResults,
  people: People,
  documents: Documents,
};

/** Monochrome flat illustrations (original artwork) for empty and welcome states. */
export function Illustration({ name, width = 240 }: { name: IllustrationName; width?: number }) {
  const Art = ART[name];
  return (
    <Svg width={width} height={(width * 180) / 240} viewBox="0 0 240 180">
      <Art />
    </Svg>
  );
}
