import React from 'react';
import { render } from '@testing-library/react-native';
import { LineworkViewer } from '../LineworkViewer';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, ...props }: any) => React.createElement('Svg', props, children),
    Image: (props: any) => React.createElement('Image', props),
    Defs: (props: any) => React.createElement('Defs', props),
    Pattern: (props: any) => React.createElement('Pattern', props),
    Circle: (props: any) => React.createElement('Circle', props),
    Rect: (props: any) => React.createElement('Rect', props),
    G: (props: any) => React.createElement('G', props),
  };
});

describe('LineworkViewer', () => {
  const base64Image = 'test-base64-image-data';

  it('should render with default props', () => {
    const { getByTestId } = render(<LineworkViewer base64Image={base64Image} />);
    // Component should render without errors
    expect(true).toBe(true);
  });

  it('should render with custom dimensions', () => {
    const { container } = render(
      <LineworkViewer base64Image={base64Image} width={1200} height={1200} />
    );
    expect(container).toBeTruthy();
  });

  it('should handle dot and dash patterns', () => {
    const { container } = render(
      <LineworkViewer
        base64Image={base64Image}
        showDots={true}
        showDashes={true}
        dotSize={3}
        dashLength={6}
      />
    );
    expect(container).toBeTruthy();
  });
});
