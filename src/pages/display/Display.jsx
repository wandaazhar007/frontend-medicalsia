import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublicQueue } from '../../services/publicBooking';
import LogoIcon from '../../components/LogoIcon/LogoIcon';
import Wordmark from '../../components/LogoIcon/Wordmark';
import Button from '../../components/Button/Button';
import styles from './Display.module.scss';

const POLL_INTERVAL_MS = 4000;

// Short chime via Web Audio API — no external asset needed, just enough to
// draw attention before the spoken announcement (06-design-system.md).
function playChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContextClass();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.3);
}

function speakAnnouncement(queueNumber) {
  const utterance = new SpeechSynthesisUtterance(`Nomor antrian ${queueNumber}, silakan menuju ruang dokter.`);
  utterance.lang = 'id-ID';
  window.speechSynthesis.speak(utterance);
}

export default function Display() {
  const { t } = useTranslation();
  const [currentNumber, setCurrentNumber] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const lastCallIdRef = useRef(null);
  const isSoundEnabledRef = useRef(false);

  async function poll() {
    const { last_call } = await getPublicQueue();
    if (!last_call) return;

    setCurrentNumber(last_call.queue_number);

    const isNewCall = last_call.id !== lastCallIdRef.current;
    const isFirstPoll = lastCallIdRef.current === null;
    lastCallIdRef.current = last_call.id;

    // Don't announce whatever was already "last called" the moment the
    // screen loads — only calls that happen while it's open.
    if (isNewCall && !isFirstPoll) {
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 2400);

      if (isSoundEnabledRef.current) {
        playChime();
        setTimeout(() => speakAnnouncement(last_call.queue_number), 400);
      }
    }
  }

  useEffect(() => {
    poll();
    const intervalId = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  function handleEnableSound() {
    isSoundEnabledRef.current = true;
    setIsSoundEnabled(true);
    // Some browsers only unlock speechSynthesis after a voice has actually
    // been spoken from a user gesture — this primes it silently-ish.
    speakAnnouncement('siap');
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <LogoIcon variant="dark" size={36} />
        <Wordmark variant="dark" />
      </div>

      <div className={styles.content}>
        <span className={styles.label}>{t('displayPage.label')}</span>
        <span className={`${styles.number} ${isFlashing ? styles.flash : ''}`}>{currentNumber || '-'}</span>
      </div>

      {!isSoundEnabled && (
        <div className={styles.overlay}>
          <Button onClick={handleEnableSound}>{t('displayPage.enableSound')}</Button>
        </div>
      )}
    </div>
  );
}
