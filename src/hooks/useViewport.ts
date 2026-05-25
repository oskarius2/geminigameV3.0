import { useState, useRef, useEffect, type MutableRefObject } from 'react';
import {
  getViewportSnapshot,
  subscribeViewport,
  type ViewportProfile,
} from '../game/controls/mobileLayout';

export interface ViewportState {
  dimensions: { width: number; height: number };
  viewportProfile: ViewportProfile;
  compactHud: boolean;
  landscapeHud: boolean;
  showTouchControls: boolean;
  isMobile: boolean;
  /** Stable ref — always holds the latest ViewportProfile without causing re-renders. */
  viewportProfileRef: MutableRefObject<ViewportProfile>;
  /** Stable ref — true when the device should skip expensive render effects. */
  reducedEffectsRef: MutableRefObject<boolean>;
}

interface UseViewportOptions {
  /**
   * Called whenever the viewport profile changes (e.g. device rotates from
   * portrait to landscape). Typically used to reset joystick / input state.
   */
  onProfileChange?: (next: ViewportProfile) => void;
}

/**
 * Owns viewport dimensions, profile detection and the subscription to
 * `mobileLayout.subscribeViewport`. Replaces the scattered viewport state
 * and init useEffect that previously lived in App.tsx.
 */
export function useViewport({ onProfileChange }: UseViewportOptions = {}): ViewportState {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [viewportProfile, setViewportProfile] = useState<ViewportProfile>('desktop');
  const [compactHud, setCompactHud] = useState(false);
  const [landscapeHud, setLandscapeHud] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);

  const viewportProfileRef = useRef<ViewportProfile>('desktop');
  const reducedEffectsRef = useRef(false);

  // Keep a stable ref to the callback so the subscription doesn't need to
  // re-register when onProfileChange identity changes.
  const onProfileChangeRef = useRef(onProfileChange);
  useEffect(() => {
    onProfileChangeRef.current = onProfileChange;
  });

  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const snap = getViewportSnapshot(w, h);
      const prev = viewportProfileRef.current;

      setDimensions({ width: w, height: h });
      setViewportProfile(snap.profile);
      setCompactHud(snap.compactHud);
      setLandscapeHud(snap.landscapeHud);
      setShowTouchControls(snap.showTouchControls);

      viewportProfileRef.current = snap.profile;
      reducedEffectsRef.current = snap.reducedEffects;

      if (prev !== snap.profile) {
        onProfileChangeRef.current?.(snap.profile);
      }
    };

    apply();
    return subscribeViewport(apply);
  }, []); // runs once — subscription handles all updates

  return {
    dimensions,
    viewportProfile,
    compactHud,
    landscapeHud,
    showTouchControls,
    isMobile: viewportProfile !== 'desktop',
    viewportProfileRef,
    reducedEffectsRef,
  };
}
