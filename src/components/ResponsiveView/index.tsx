import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { getSpacing } from '../../utils/responsive';

interface ResponsiveViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
}

const ResponsiveView: React.FC<ResponsiveViewProps> = ({
  children,
  style,
  padding,
  margin,
}) => {
  const responsivePadding = padding !== undefined ? getSpacing(padding) : undefined;
  const responsiveMargin = margin !== undefined ? getSpacing(margin) : undefined;

  return (
    <View
      style={[
        styles.container,
        {
          padding: responsivePadding,
          margin: responsiveMargin,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default ResponsiveView;


