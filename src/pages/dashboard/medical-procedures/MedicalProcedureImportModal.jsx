import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload } from 'lucide-react';
import { previewMedicalProcedureImport, commitMedicalProcedureImport } from '../../../services/medicalProcedures';
import Modal from '../../../components/Modal/Modal';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import styles from './MedicalProcedureImportModal.module.scss';

const TEMPLATE_CSV = 'Nama Tindakan,Harga\nSuntik Vitamin,50000\n';

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'template-import-tindakan.csv';
  link.click();
  URL.revokeObjectURL(url);
}

// phase: 'select' -> 'previewing' -> 'preview' -> 'importing' -> 'done'
export default function MedicalProcedureImportModal({ isOpen, onClose, onImported }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [phase, setPhase] = useState('select');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total: 0, valid: 0, invalid: 0 });
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  function reset() {
    setPhase('select');
    setRows([]);
    setSummary({ total: 0, valid: 0, invalid: 0 });
    setError('');
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setError('');
    setPhase('previewing');
    try {
      const { data } = await previewMedicalProcedureImport(file);
      setRows(data.rows);
      setSummary(data.summary);
      setPhase('preview');
    } catch {
      setError(t('medicalProceduresPage.import.parseError'));
      setPhase('select');
    }
  }

  async function handleImport() {
    const validRows = rows.filter((r) => r.valid).map((r) => r.data);
    setError('');
    setPhase('importing');
    try {
      const { data } = await commitMedicalProcedureImport(validRows);
      setResult(data);
      setPhase('done');
      onImported();
    } catch {
      setError(t('medicalProceduresPage.import.importError'));
      setPhase('preview');
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('medicalProceduresPage.import.title')}>
      {error && <div className={styles.error}>{error}</div>}

      {(phase === 'select' || phase === 'previewing') && (
        <div className={styles.selectPhase}>
          <p className={styles.hint}>{t('medicalProceduresPage.import.selectFileHint')}</p>
          <div className={styles.selectActions}>
            <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={phase === 'previewing'}>
              <Upload size={14} />
              {phase === 'previewing' ? t('medicalProceduresPage.import.parsing') : t('medicalProceduresPage.import.chooseFileButton')}
            </Button>
            <Button type="button" variant="secondary" onClick={downloadTemplate}>
              <Download size={14} />
              {t('medicalProceduresPage.import.downloadTemplateButton')}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className={styles.hiddenFileInput}
            onChange={handleFileChange}
          />
        </div>
      )}

      {(phase === 'preview' || phase === 'importing') && (
        <div className={styles.previewPhase}>
          <p className={styles.summary}>
            {t('medicalProceduresPage.import.summary', { valid: summary.valid, total: summary.total, invalid: summary.invalid })}
          </p>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('medicalProceduresPage.import.columnRow')}</th>
                  <th>{t('medicalProceduresPage.import.columnName')}</th>
                  <th>{t('medicalProceduresPage.import.columnPrice')}</th>
                  <th>{t('medicalProceduresPage.import.columnStatus')}</th>
                  <th>{t('medicalProceduresPage.import.columnError')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.row_number}>
                    <td>{row.row_number}</td>
                    <td>{row.valid ? row.data.name : '-'}</td>
                    <td>{row.valid ? formatCurrency(row.data.price) : '-'}</td>
                    <td><Badge variant={row.valid ? 'success' : 'danger'}>{row.valid ? t('medicalProceduresPage.import.statusValid') : t('medicalProceduresPage.import.statusInvalid')}</Badge></td>
                    <td>{row.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.actions}>
            <Button type="button" variant="secondary" onClick={reset} disabled={phase === 'importing'}>
              {t('medicalProceduresPage.import.backButton')}
            </Button>
            <Button type="button" variant="ghost" onClick={handleClose} disabled={phase === 'importing'}>
              {t('medicalProceduresPage.import.cancelButton')}
            </Button>
            <Button type="button" onClick={handleImport} disabled={summary.valid === 0 || phase === 'importing'}>
              {phase === 'importing' ? t('medicalProceduresPage.import.importing') : t('medicalProceduresPage.import.importButton', { count: summary.valid })}
            </Button>
          </div>
        </div>
      )}

      {phase === 'done' && result && (
        <div className={styles.donePhase}>
          <h3>{t('medicalProceduresPage.import.doneTitle')}</h3>
          <p>{t('medicalProceduresPage.import.doneSummary', { imported: result.imported })}</p>
          {result.failed.length > 0 && <p className={styles.doneFailed}>{t('medicalProceduresPage.import.doneFailedSummary', { count: result.failed.length })}</p>}
          <div className={styles.actions}>
            <Button type="button" onClick={handleClose}>{t('medicalProceduresPage.import.closeButton')}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
