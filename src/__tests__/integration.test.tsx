import React from 'react';
import { render } from '@testing-library/react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

describe('App Integration', () => {
  it('should render providers without crashing', () => {
    const TestComponent = () => (
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <></>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    );

    const { container } = render(<TestComponent />);
    expect(container).toBeTruthy();
  });

  it('should handle theme context', () => {
    const TestComponent = () => {
      const { useTheme } = require('../contexts/ThemeContext');
      const { colors } = useTheme();
      return <></>;
    };

    const { container } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    expect(container).toBeTruthy();
  });
});
