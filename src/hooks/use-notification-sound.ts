'use client';

import { useCallback, useRef } from 'react';

interface UseNotificationSoundOptions {
  volume?: number;
  enabled?: boolean;
}

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
  const { volume = 0.3, enabled = true } = options;

  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    if (!enabled) return;

    try {
      // AudioContext 생성 (재사용)
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;

      // 오실레이터 생성 - 간단한 "띵" 소리
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // 주파수 설정 (880Hz = A5 음, 높고 맑은 소리)
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.type = 'sine';

      // 볼륨 엔벨로프 - 부드럽게 시작해서 페이드아웃
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      // 재생
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);
    } catch (error) {
      console.warn('알림 소리 재생 실패:', error);
    }
  }, [enabled, volume]);

  return { playSound };
}
