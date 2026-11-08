import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, IconName } from '../theme';

/** Minimal line icons drawn on a 24x24 grid. Original artwork, no icon font. */
export function Icon({
  name,
  size = 20,
  color = colors.black,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const p = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {renderIcon(name, p, color)}
    </Svg>
  );
}

type StrokeProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: string;
};

function renderIcon(name: IconName, p: StrokeProps, color: string) {
  switch (name) {
    case 'alert':
      return (
        <>
          <Path d="M12 3 2.5 20h19L12 3Z" {...p} />
          <Path d="M12 10v4.5" {...p} />
          <Circle cx={12} cy={17.3} r={0.6} fill={color} stroke={color} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={3.5} y={5} width={17} height={15.5} rx={2.5} {...p} />
          <Path d="M3.5 10h17M8 3v4M16 3v4" {...p} />
        </>
      );
    case 'chat':
      return (
        <>
          <Path
            d="M4 19.5 5.3 15.6A8 8 0 1 1 8.4 18.7L4 19.5Z"
            {...p}
          />
          <Path d="M9.2 9.3c.2 2.6 2.4 4.9 5.2 5.4l1.2-1.3-1.8-1-.8.8c-1-.4-1.8-1.2-2.2-2.2l.8-.8-1-1.8-1.4 1Z" {...p} strokeWidth={1.2} />
        </>
      );
    case 'check':
      return <Path d="m5 12.5 4.5 4.5L19 7.5" {...p} />;
    case 'checkCircle':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="m8 12.3 2.8 2.8L16.2 9.6" {...p} />
        </>
      );
    case 'chevronRight':
      return <Path d="m9.5 5.5 6.5 6.5-6.5 6.5" {...p} />;
    case 'clock':
      return (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 7v5l3.2 2" {...p} />
        </>
      );
    case 'cog':
      return (
        <>
          <Circle cx={12} cy={12} r={3.2} {...p} />
          <Path
            d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"
            {...p}
          />
          <Circle cx={12} cy={12} r={6.6} {...p} />
        </>
      );
    case 'doc':
      return (
        <>
          <Path d="M6 3h8l4.5 4.5V21H6V3Z" {...p} />
          <Path d="M14 3v4.5h4.5M9 12h6M9 16h6" {...p} />
        </>
      );
    case 'download':
      return <Path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" {...p} />;
    case 'upload':
      return <Path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 20h14" {...p} />;
    case 'edit':
      return (
        <>
          <Path d="M4 20h4L19 9l-4-4L4 16v4Z" {...p} />
          <Path d="m13.5 6.5 4 4" {...p} />
        </>
      );
    case 'flag':
      return <Path d="M6 21V4m0 0h11l-2.5 4L17 12H6" {...p} />;
    case 'home':
      return (
        <>
          <Path d="M3.5 11 12 4l8.5 7" {...p} />
          <Path d="M6 9.5V20h12V9.5M10 20v-5h4v5" {...p} />
        </>
      );
    case 'person':
      return (
        <>
          <Circle cx={12} cy={8} r={4} {...p} />
          <Path d="M4 20.5c1.2-4 4.3-6 8-6s6.8 2 8 6" {...p} />
        </>
      );
    case 'phone':
      return (
        <Path
          d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z"
          {...p}
        />
      );
    case 'plus':
      return <Path d="M12 5v14M5 12h14" {...p} />;
    case 'bell':
      return (
        <>
          <Path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z" {...p} />
          <Path d="M10 21h4" {...p} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx={11} cy={11} r={6.5} {...p} />
          <Path d="m16 16 4.5 4.5" {...p} />
        </>
      );
    case 'trash':
      return (
        <>
          <Path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" {...p} />
          <Path d="M10 11v5.5M14 11v5.5" {...p} />
        </>
      );
    case 'users':
      return (
        <>
          <Circle cx={9} cy={8.5} r={3.5} {...p} />
          <Path d="M2.5 19.5c.9-3.4 3.4-5 6.5-5s5.6 1.6 6.5 5" {...p} />
          <Path d="M15.5 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.8c2 .6 3.4 2.2 4 4.7" {...p} />
        </>
      );
  }
}
