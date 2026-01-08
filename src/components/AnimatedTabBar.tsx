import React from 'react';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AnimatedTabBarProps {
  focused: boolean;
  children: React.ReactNode;
}

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({ focused, children }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(focused ? 1.1 : 1, {
            damping: 10,
            stiffness: 100,
          }),
        },
      ],
      opacity: withSpring(focused ? 1 : 0.6, {
        damping: 10,
        stiffness: 100,
      }),
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};
