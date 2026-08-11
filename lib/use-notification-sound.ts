/**
 * useNotificationSound
 * 
 * Hook reutilizable para reproducir tonos de notificación usando Web Audio API.
 * No requiere archivos de audio externos.
 * 
 * Uso:
 *   const { playNotification, playMessage } = useNotificationSound();
 *   playNotification();   // chime doble suave (para notificaciones del sistema)
 *   playMessage();        // chime suave de mensaje de chat
 *   playMessage(3);       // reproduce 3 veces seguidas
 */

"use client";

import { useCallback, useRef } from "react";

function createAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    return Ctx ? new Ctx() : null;
  } catch {
    return null;
  }
}

/**
 * Tono tipo "message received" — dos notas suaves descendentes (como WhatsApp/Telegram)
 * Primera nota: Do6 (1046 Hz), segunda nota: Sol5 (784 Hz)
 */
function playChatChime(ctx: AudioContext, startTime = 0) {
  const notes = [1046.5, 783.99]; // C6, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = startTime + i * 0.13;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.start(t);
    osc.stop(t + 0.3);
  });
}

/**
 * Tono tipo "notification bell" — tres notas ascendentes (Do5, Mi5, Sol5)
 * Suena como una campanita de alerta de sistema
 */
function playBellChime(ctx: AudioContext, startTime = 0) {
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = startTime + i * 0.12;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.start(t);
    osc.stop(t + 0.42);
  });
}

export function useNotificationSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    if (ctxRef.current?.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  /**
   * Campana triple ascendente — para notificaciones del sistema.
   * @param count  cuántas veces reproducir el chime (default 1)
   */
  const playNotification = useCallback((count = 1) => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      playBellChime(ctx, now + i * 0.55);
    }
  }, [getCtx]);

  /**
   * Chime doble suave — para mensajes de chat entrantes.
   * @param count  cuántas veces reproducir (default 1)
   */
  const playMessage = useCallback((count = 1) => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      playChatChime(ctx, now + i * 0.35);
    }
  }, [getCtx]);

  return { playNotification, playMessage };
}
