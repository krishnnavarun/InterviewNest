import { useCallback, useEffect, useRef, useState } from 'react';
import { interviewApi } from '@/lib/services';

/**
 * Plays the interviewer's lines. Primary voice: Murf (streamed by our API).
 * Fallback: the browser's built-in speech synthesis, so the interview still
 * works when the TTS service is down or not configured.
 */
export function useInterviewerVoice(interviewId, enabled, serverTts = true) {
  const [speaking, setSpeaking] = useState(false);
  const [blocked, setBlocked] = useState(false); // browser refused autoplay
  const audioRef = useRef(null);
  const abortRef = useRef(null);
  const urlRef = useRef(null);
  const pendingRef = useRef(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => stop, [stop]);

  const speakWithBrowser = useCallback((text) => {
    if (!window.speechSynthesis || !text) return setSpeaking(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    const voice = window.speechSynthesis.getVoices().find((item) => /en[-_]US/i.test(item.lang) && /female|samantha|zira|jenny|aria/i.test(item.name));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(
    async (turnIndex, text) => {
      stop();
      if (!enabled || !text) return;
      if (!serverTts) {
        setSpeaking(true);
        speakWithBrowser(text);
        return;
      }
      pendingRef.current = { turnIndex, text };
      setBlocked(false);
      setSpeaking(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let blob;
      try {
        blob = await interviewApi.speech(interviewId, turnIndex, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return;
        speakWithBrowser(text);
        return;
      }
      if (controller.signal.aborted) return;

      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      try {
        await audio.play();
      } catch (error) {
        setSpeaking(false);
        if (error?.name === 'NotAllowedError') setBlocked(true); // needs a user gesture
      }
    },
    [enabled, interviewId, serverTts, speakWithBrowser, stop]
  );

  /** Replay after the browser blocked autoplay (called from a click). */
  const resume = useCallback(() => {
    if (audioRef.current) {
      setBlocked(false);
      setSpeaking(true);
      audioRef.current.play().catch(() => setSpeaking(false));
    } else if (pendingRef.current) {
      speak(pendingRef.current.turnIndex, pendingRef.current.text);
    }
  }, [speak]);

  return { speaking, blocked, speak, stop, resume };
}
