import { useCallback, useEffect, useRef, useState } from 'react';

const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const pickMimeType = () => MIME_TYPES.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) ?? '';

/**
 * Microphone recorder with a live input level (0-1) and elapsed time.
 * Calls onComplete(blob, seconds) when stopped with `stop()`; `cancel()` discards.
 */
export function useRecorder({ maxSeconds = 180, onComplete } = {}) {
  const [status, setStatus] = useState('idle'); // idle | requesting | recording
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const discardRef = useRef(false);
  const startedAtRef = useRef(0);
  const frameRef = useRef(0);
  const timerRef = useRef(0);
  const audioContextRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanup = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    discardRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error('Voice recording is not supported in this browser. Please type your answer.');
    }
    setStatus('requesting');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setStatus('idle');
      throw new Error('Microphone access was blocked. Allow it in your browser settings, or type your answer.');
    }
    streamRef.current = stream;

    // Input level meter
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (AudioContextClass) {
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const sample of data) sum += ((sample - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
        frameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }

    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;
    chunksRef.current = [];
    discardRef.current = false;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      cleanup();
      setStatus('idle');
      setElapsed(0);
      if (!discardRef.current && blob.size > 0) onCompleteRef.current?.(blob, seconds);
    };

    recorder.start(250);
    startedAtRef.current = Date.now();
    setElapsed(0);
    setStatus('recording');
    timerRef.current = setInterval(() => {
      const seconds = (Date.now() - startedAtRef.current) / 1000;
      setElapsed(seconds);
      if (seconds >= maxSeconds) recorder.state === 'recording' && recorder.stop();
    }, 250);
  }, [cleanup, maxSeconds]);

  return { status, elapsed, level, start, stop, cancel, maxSeconds };
}
