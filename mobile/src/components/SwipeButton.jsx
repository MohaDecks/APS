import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Animated, PanResponder, Platform,
} from 'react-native';
import { theme } from '../lib/theme';
import { SWIPE_TRACK, BRAND_RED, BRAND_RED_DARK } from '../lib/brand';

const THUMB = 48;
const HEIGHT = 58;
const PAD = 5;
const isWeb = Platform.OS === 'web';

export default function SwipeButton({
  label = 'Swipe to confirm',
  hint,
  onComplete,
  disabled = false,
  color = SWIPE_TRACK,
  thumbColor = '#fff',
  textColor = '#fff',
  hintColor = 'rgba(255,255,255,0.55)',
  resetKey = 0,
  completedColor = BRAND_RED,
}) {
  const [width, setWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const [locked, setLocked] = useState(false);
  const trackRef = useRef(null);

  const widthRef = useRef(0);
  const maxSlideRef = useRef(0);
  const disabledRef = useRef(disabled);
  const lockedRef = useRef(locked);
  const currentDx = useRef(0);

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

  // Web: native listeners (non-passive) — avoids React passive touch + preventDefault spam
  useEffect(() => {
    if (!isWeb || !trackRef.current) return undefined;

    const node = trackRef.current;
    const dom = node._node ?? node;
    if (!dom || typeof dom.addEventListener !== 'function') return undefined;

    let dragging = false;
    let startX = 0;

    const onDown = (clientX) => {
      if (!canInteract()) return;
      dragging = true;
      startX = clientX;
      translateX.stopAnimation();
      currentDx.current = 0;
    };

    const onMove = (clientX, e) => {
      if (!dragging) return;
      setSlide(clientX - startX);
      if (e?.cancelable) e.preventDefault();
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      finishSwipe(currentDx.current);
    };

    const mouseDown = (e) => onDown(e.clientX);
    const mouseMove = (e) => onMove(e.clientX, e);
    const touchStart = (e) => {
      const x = e.touches?.[0]?.clientX;
      if (x != null) onDown(x);
    };
    const touchMove = (e) => {
      const x = e.touches?.[0]?.clientX;
      if (x != null) onMove(x, e);
    };

    dom.addEventListener('mousedown', mouseDown);
    dom.addEventListener('touchstart', touchStart, { passive: true });
    dom.addEventListener('touchmove', touchMove, { passive: false });
    window.addEventListener('mousemove', mouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    window.addEventListener('touchcancel', onUp);

    return () => {
      dom.removeEventListener('mousedown', mouseDown);
      dom.removeEventListener('touchstart', touchStart);
      dom.removeEventListener('touchmove', touchMove);
      window.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      window.removeEventListener('touchcancel', onUp);
    };
  }, [canInteract, finishSwipe, setSlide, translateX, width]);

  const bg = locked ? completedColor : disabled ? '#e5e5ea' : color;
  const thumbTop = (HEIGHT - THUMB) / 2;
  const maxSlide = maxSlideRef.current || Math.max(0, width - THUMB - PAD * 2);

  return (
    <View style={styles.wrap}>
      <View style={styles.container} onLayout={onLayout}>
        <View
          ref={trackRef}
          style={[
            styles.track,
            {
              backgroundColor: bg,
              opacity: width > 0 ? 1 : 0,
              borderColor: disabled && !locked ? '#e5e5ea' : locked ? completedColor : BRAND_RED_DARK,
            },
          ]}
          {...(!isWeb ? panResponder.panHandlers : {})}
        >
          <View style={styles.labelWrap} pointerEvents="none">
            <Text
              style={[
                styles.label,
                { color: locked ? '#fff' : disabled ? '#aeaeb2' : textColor },
              ]}
              numberOfLines={1}
            >
              {locked ? 'Confirmed' : label}
            </Text>
            {!locked && hint && !disabled && (
              <Text style={[styles.hint, { color: hintColor }]}>{hint}</Text>
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
              <Text style={[styles.arrow, { color: locked ? completedColor : disabled ? '#aeaeb2' : BRAND_RED }]}>
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
    ...(isWeb ? { touchAction: 'none' } : {}),
  },
  container: {
    width: '100%',
    ...(isWeb ? { touchAction: 'none' } : {}),
  },
  track: {
    width: '100%',
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    cursor: isWeb ? 'grab' : undefined,
    ...(isWeb ? { touchAction: 'none', userSelect: 'none' } : {}),
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: THUMB + 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: theme.font,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
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
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  arrow: { fontSize: 24, fontWeight: '700', marginLeft: 2, lineHeight: 26 },
});
