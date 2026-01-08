import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Image, Defs, Pattern, Circle, Rect, G } from 'react-native-svg';

interface LineworkViewerProps {
  base64Image: string;
  width?: number;
  height?: number;
  showDots?: boolean;
  showDashes?: boolean;
  dotSize?: number;
  dashLength?: number;
  dashGap?: number;
}

/**
 * LineworkViewer - Renders SVG with optional dot/dash shading patterns
 * Optimized for high-quality tattoo linework display and export
 */
export const LineworkViewer: React.FC<LineworkViewerProps> = ({
  base64Image,
  width = 800,
  height = 800,
  showDots = true,
  showDashes = true,
  dotSize = 2,
  dashLength = 4,
  dashGap = 2,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const displayWidth = Math.min(width, screenWidth - 32);
  const displayHeight = (displayWidth / width) * height;

  // Create dot pattern for shading
  const dotPatternId = 'dot-pattern';
  const dashPatternId = 'dash-pattern';

  return (
    <View style={styles.container}>
      <Svg
        width={displayWidth}
        height={displayHeight}
        viewBox={`0 0 ${width} ${height}`}
        style={styles.svg}
      >
        <Defs>
          {/* Dot pattern for shading references */}
          {showDots && (
            <Pattern
              id={dotPatternId}
              x="0"
              y="0"
              width={dotSize * 4}
              height={dotSize * 4}
              patternUnits="userSpaceOnUse"
            >
              <Circle
                cx={dotSize * 2}
                cy={dotSize * 2}
                r={dotSize}
                fill="black"
                opacity="0.3"
              />
            </Pattern>
          )}

          {/* Dash pattern for shading references */}
          {showDashes && (
            <Pattern
              id={dashPatternId}
              x="0"
              y="0"
              width={dashLength + dashGap}
              height={dashLength + dashGap}
              patternUnits="userSpaceOnUse"
            >
              <Rect
                x="0"
                y="0"
                width={dashLength}
                height={1}
                fill="black"
                opacity="0.2"
              />
            </Pattern>
          )}
        </Defs>

        {/* Main linework image */}
        <Image
          href={`data:image/png;base64,${base64Image}`}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* Optional overlay patterns for shading visualization */}
        {showDots && (
          <G opacity="0.1">
            <Rect
              x="0"
              y="0"
              width={width}
              height={height}
              fill={`url(#${dotPatternId})`}
            />
          </G>
        )}
      </Svg>
    </View>
  );
};

/**
 * Generate enhanced SVG with dot/dash patterns embedded
 * Optimized for export at 300 DPI
 */
export function generateEnhancedSVG(
  base64Image: string,
  width: number = 2400, // 8 inches at 300 DPI
  height: number = 2400,
  options: {
    showDots?: boolean;
    showDashes?: boolean;
    dotSize?: number;
    dashLength?: number;
    dashGap?: number;
  } = {}
): string {
  const {
    showDots = true,
    showDashes = true,
    dotSize = 3,
    dashLength = 6,
    dashGap = 3,
  } = options;

  const dotPatternId = 'dot-pattern';
  const dashPatternId = 'dash-pattern';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    ${showDots ? `
    <pattern id="${dotPatternId}" x="0" y="0" width="${dotSize * 4}" height="${dotSize * 4}" patternUnits="userSpaceOnUse">
      <circle cx="${dotSize * 2}" cy="${dotSize * 2}" r="${dotSize}" fill="black" opacity="0.3"/>
    </pattern>
    ` : ''}
    ${showDashes ? `
    <pattern id="${dashPatternId}" x="0" y="0" width="${dashLength + dashGap}" height="${dashLength + dashGap}" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="${dashLength}" height="1" fill="black" opacity="0.2"/>
    </pattern>
    ` : ''}
  </defs>
  <image x="0" y="0" width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64Image}" preserveAspectRatio="xMidYMid meet"/>
  ${showDots ? `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#${dotPatternId})" opacity="0.1"/>` : ''}
</svg>`;

  return svg;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    backgroundColor: 'transparent',
  },
});
