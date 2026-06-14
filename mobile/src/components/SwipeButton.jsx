import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder, Platform,
} from 'react-native';
import { theme } from '../lib/theme';

const THUMB = 48;
const HEIGHT = 56;
const PAD = 4;
const isWeb = Platform.OS === 'web';

export default function SwipeButton({
  label = 'Swipe to confirm',
  hint,
  onComplete,
  disabled = false,
  color = theme.dark,
  thumbColor = '#fff',
  textColor = '#fff',
  resetKey = 0,
  completedColor = theme.green,
}) {
  const [width, setWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [locked, setLocked] = useState(false);

  const widthRef = useRef(0);
  const maxSlideRef = useRef(0);
  const disabledRef = useRef(disabled);
  const lockedRef = useRef(locked);
  const currentDx = useRef(0);
  const dragging = useRef(false);
  const startClientX = useRef(0);

  useEffect(() => { disabledRef.current = disabled; }, [disabled]);
  useEffect(() => { lockedRef.current = locked; }, [locked]);

  const reset = useCallback(() => {
    setLocked(false);
    lockedRef.current = false;
    translateX.setValue(0);
    currentDx.current = 0;
  }, [translateX]);

  const onLayout = (e) => {
    const w = Math.floor(e.nativeEvent.layout.width);
    if (w > 0 && w !== widthRef.current) {
      widthRef.current = w;
      maxSlideRef.current = Math.max(0, w - THUMB - PAD * 2);
      setWidth(w);
    }
  };

  useEffect(() => { reset(); }, [resetKey, reset]);

  const finishSwipe = useCallback((dx) => {
    const maxSlide = maxSlideRef.current;
    if (maxSlide <= 0 || lockedRef.current) return;

    if (dx >= maxSlide * 0.8) {
      Animated.timing(translateX, { toValue: maxSlide, duration: 140, useNativeDriver: false }).start(() => {
        setLocked(true);
        lockedRef.current = true;
        onComplete?.();
      });
    } else {
      currentDx.current = 0;
      Animated.spring(translateX, { toValue: 0, useNativeDriver: false, friction: 8 }).start();
    }
  }, [onComplete, translateX]);

  const setSlide = useCallback((dx) => {
    const maxSlide = maxSlideRef.current;
    const x = Math.max(0, Math.min(dx, maxSlide));
    currentDx.current = x;
    translateX.setValue(x);
  }, [translateX]);

  const canInteract = useCallback(() => (
    !disabledRef.current && !lockedRef.current && maxSlideRef.current > 0
  ), []);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => canInteract(),
    onMoveShouldSetPanResponder: (_, g) => canInteract() && Math.abs(g.dx) > 2,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      translateX.stopAnimation();
      currentDx.current = 0;
    },
    onPanResponderMove: (_, g) => {
      if (g.dx < 0) return;
      setSlide(g.dx);
    },
    onPanResponderRelease: () => finishSwipe(currentDx.current),
    onPanResponderTerminate: () => {
      currentDx.current = 0;
      Animated.spring(translateX, { toValue: 0, useNativeDriver: false, friction: 8 }).start();
    },
  }), [canInteract, finishSwipe, setSlide, translateX]);

  const pointerDown = useCallback((clientX) => {
    if (!canInteract()) return;
    dragging.current = true;
    startClientX.current = clientX;
    translateX.stopAnimation();
    currentDx.current = 0;
  }, [canInteract, translateX]);

  const pointerMove = useCallback((clientX) => {
    if (!dragging.current) return;
    setSlide(clientX - startClientX.current);
  }, [setSlide]);

  const pointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    finishSwipe(currentDx.current);
  }, [finishSwipe]);

  useEffect(() => {
    if (!isWeb) return;
    const onMouseMove = (e) => pointerMove(e.clientX);
    const onTouchMove = (e) => {
      if (!dragging.current) return;
      const x = e.touches?.[0]?.clientX;
      if (x != null) pointerMove(x);
      e.preventDefault();
    };
    const onUp = () => pointerUp();
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, [pointerMove, pointerUp]);

  const webHandlers = isWeb ? {
    onMouseDown: (e) => {
      const ne = e.nativeEvent ?? e;
      const x = ne.touches?.[0]?.clientX ?? ne.clientX;
      if (x != null) pointerDown(x);
      e.preventDefault?.();
    },
    onTouchStart: (e) => {
      const ne = e.nativeEvent ?? e;
      const x = ne.touches?.[0]?.clientX;
      if (x != null) pointerDown(x);
      e.preventDefault?.();
    },
    onTouchMove: (e) => {
      if (!dragging.current) return;
      const ne = e.nativeEvent ?? e;
      const x = ne.touches?.[0]?.clientX;
      if (x != null) pointerMove(x);
      e.preventDefault?.();
    },
    onTouchEnd: pointerUp,
    onTouchCancel: pointerUp,
  } : {};

  const bg = locked ? completedColor : disabled ? theme.separator : color;
  const thumbTop = (HEIGHT - THUMB) / 2;
  const maxSlide = maxSlideRef.current || Math.max(0, width - THUMB - PAD * 2);

  return (
    <View style={styles.wrap}>
      <View style={styles.container} onLayout={onLayout}>
        <View
          style={[styles.track, { backgroundColor: bg, opacity: width > 0 ? 1 : 0 }]}
          {...panResponder.panHandlers}
          {...webHandlers}
        >
          <View style={styles.labelWrap} pointerEvents="none">
            <Text style={[styles.label, { color: locked ? '#fff' : textColor, opacity: disabled && !locked ? 0.45 : 1 }]} numberOfLines={1}>
              {locked ? 'Confirmed' : label}
            </Text>
            {!locked && hint && !disabled && (
              <Text style={[styles.hint, { color: textColor }]}>{hint}</Text>
            )}
          </View>

          {width > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.thumb,
                {
                  top: thumbTop,
                  backgroundColor: locked ? '#fff' : thumbColor,
                  transform: [{ translateX: locked ? maxSlide : translateX }],
                },
              ]}
            >
              <Text style={[styles.arrow, { color: locked ? completedColor : disabled ? theme.label : color }]}>
                {locked ? '✓' : '›'}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: HEIGHT / 2,
    overflow: 'hidden',
  },
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    ...(isWeb ? { touchAction: 'none', userSelect: 'none' } : {}),
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THUMB + 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: theme.font,
    textAlign: 'center',
  },
  hint: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
    marginTop: 2,
    fontFamily: theme.font,
  },
  thumb: {
    position: 'absolute',
    left: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  arrow: { fontSize: 22, fontWeight: '700', marginLeft: 2 },
});
