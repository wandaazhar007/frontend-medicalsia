import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPublicPharmacyQueue } from '../../services/publicBooking';
import LogoIcon from '../../components/LogoIcon/LogoIcon';
import Wordmark from '../../components/LogoIcon/Wordmark';
import Badge from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import styles from './DisplayPharmacy.module.scss';

const POLL_INTERVAL_MS = 4000;

const STATUS_KEYS = { sedang_disiapkan: 'statusPreparing', siap_diambil: 'statusReady' };
const STATUS_VARIANTS = { sedang_disiapkan: 'warning', siap_diambil: 'success' };

// Same chime pattern as /display (Fase 3) — Web Audio API, no external asset.
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
  const utterance = new SpeechSynthesisUtterance(`Nomor antrian ${queueNumber}, obat sudah siap diambil.`);
  utterance.lang = 'id-ID';
  window.speechSynthesis.speak(utterance);
}

export default function DisplayPharmacy() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [flashingQueueNumber, setFlashingQueueNumber] = useState(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const lastCallIdRef = useRef(null);
  const isSoundEnabledRef = useRef(false);

  async function poll() {
    const { data, last_call } = await getPublicPharmacyQueue();
    setEntries(data);

    if (!last_call) return;

    const isNewCall = last_call.id !== lastCallIdRef.current;
    const isFirstPoll = lastCallIdRef.current === null;
    lastCallIdRef.current = last_call.id;

    if (isNewCall && !isFirstPoll) {
      setFlashingQueueNumber(last_call.queue_number);
      setTimeout(() => setFlashingQueueNumber(null), 2400);

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
    speakAnnouncement('siap');
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <LogoIcon variant="dark" size={36} />
        <Wordmark variant="dark" />
      </div>

      {entries.length === 0 ? (
        <p className={styles.empty}>{t('displayPharmacyPage.empty')}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('displayPharmacyPage.columnQueueNumber')}</th>
              <th>{t('displayPharmacyPage.columnStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.queue_number}>
                <td className={entry.queue_number === flashingQueueNumber ? styles.flash : ''}>{entry.queue_number}</td>
                <td>
                  <Badge variant={STATUS_VARIANTS[entry.status]}>{t(`displayPharmacyPage.${STATUS_KEYS[entry.status]}`)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isSoundEnabled && (
        <div className={styles.overlay}>
          <Button onClick={handleEnableSound}>{t('displayPharmacyPage.enableSound')}</Button>
        </div>
      )}
    </div>
  );
}
