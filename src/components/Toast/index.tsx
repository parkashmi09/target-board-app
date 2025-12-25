import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/theme';

type ToastType = 'success' | 'error' | 'info';
type ToastMessage = { text: string; type?: ToastType; durationMs?: number };

const ToastContext = createContext<{ show: (msg: ToastMessage) => void } | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const anim = useMemo(() => new Animated.Value(0), []);

  const show = useCallback((msg: ToastMessage) => {
    setMessage(msg);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start(() => {
      setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setMessage(null));
      }, msg.durationMs ?? 2500);
    });
  }, [anim]);

  const bg = message?.type === 'success' ? '#2e7d32' : message?.type === 'error' ? '#c62828' : theme.colors.secondary;

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <Animated.View style={[styles.container, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }] }]}>
          <View style={[styles.toast, { backgroundColor: bg }]}> 
            <Text style={styles.text}>{message.text}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    maxWidth: '90%',
  },
  text: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});


