import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Printer } from 'lucide-react';
import { getMedicalRecordsForPrint, getPatient } from '../../../services/patients';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/Card/Card';
import Button from '../../../components/Button/Button';
import Input from '../../../components/Input/Input';
import EmptyState from '../../../components/EmptyState/EmptyState';
import PatientCard from '../../../components/PatientCard/PatientCard';
import MedicalRecordPrint from '../../../components/MedicalRecordPrint/MedicalRecordPrint';
import styles from './PatientDetail.module.scss';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PatientDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);

  // Which printable thing is currently allowed to carry the `print-only`
  // class — only one at a time, or both would print together.
  const [printTarget, setPrintTarget] = useState(null);
  const [printRecordData, setPrintRecordData] = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isPreparingPrint, setIsPreparingPrint] = useState(false);

  async function fetchPatient() {
    const { data } = await getPatient(id);
    setPatient(data);
  }

  useEffect(() => {
    fetchPatient();

    window.addEventListener('medicalsia:connection-restored', fetchPatient);
    return () => window.removeEventListener('medicalsia:connection-restored', fetchPatient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Waits for the print-only class to actually land in the DOM before
  // opening the print dialog — setting state and calling window.print() in
  // the same handler can fire before React commits the re-render.
  useEffect(() => {
    if (printTarget) {
      window.print();
    }
  }, [printTarget]);

  function handlePrintCard() {
    setPrintTarget('card');
  }

  async function handlePrintMedicalRecord() {
    setIsPreparingPrint(true);
    try {
      const data = await getMedicalRecordsForPrint(id, { from: fromDate, to: toDate });
      setPrintRecordData(data);
      setPrintTarget('record');
    } finally {
      setIsPreparingPrint(false);
    }
  }

  if (!patient) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>{patient.full_name}</h1>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handlePrintCard}>{t('patients.detail.printCard')}</Button>
          <Button variant="secondary" onClick={() => navigate(`/dashboard/patients/${id}/edit`)}>{t('patients.detail.edit')}</Button>
        </div>
      </div>

      <Card>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.label}>{t('patients.detail.patientNumber')}</div>
            <div>{patient.patient_number}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.nik')}</div>
            <div>{patient.nik || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.dob')}</div>
            <div>{formatDate(patient.dob)}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.phone')}</div>
            <div>{patient.phone || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.email')}</div>
            <div>{patient.email || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.address')}</div>
            <div>{patient.address || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.villageDistrict')}</div>
            <div>{[patient.village, patient.district].filter(Boolean).join(' / ') || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.cityProvince')}</div>
            <div>{[patient.city, patient.province].filter(Boolean).join(' / ') || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.postalCode')}</div>
            <div>{patient.postal_code || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>{t('patients.detail.registered')}</div>
            <div>{formatDate(patient.created_at)}</div>
          </div>
        </div>
        {patient.allergies && <p className={styles.allergies}>{t('patients.detail.allergies')}: {patient.allergies}</p>}
      </Card>

      <div>
        <div className={styles.recordsHeader}>
          <h2 className={styles.sectionTitle}>{t('patients.detail.medicalHistory')}</h2>
          <div className={styles.printControls}>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <Button variant="secondary" onClick={handlePrintMedicalRecord} disabled={isPreparingPrint}>
              <Printer size={16} />
              {isPreparingPrint ? t('patients.detail.preparingPrint') : t('patients.detail.printMedicalRecord')}
            </Button>
          </div>
        </div>
        {patient.medical_records.length === 0 ? (
          <EmptyState message={t('patients.detail.noRecords')} />
        ) : (
          <Card>
            {patient.medical_records.map((record) => (
              <div key={record.id} className={styles.recordItem}>
                <span className={styles.recordDate}>
                  {formatDate(record.created_at)} — {record.doctor_name || t('patients.detail.unknownDoctor')}
                </span>
                <span>{t('patients.detail.complaint')}: {record.complaint || '-'}</span>
                <span>{t('patients.detail.diagnosis')}: {record.diagnosis || '-'}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <PatientCard patient={patient} active={printTarget === 'card'} />
      {printRecordData && (
        <MedicalRecordPrint
          patient={printRecordData.patient}
          records={printRecordData.records}
          printedBy={user?.full_name}
          active={printTarget === 'record'}
        />
      )}
    </div>
  );
}
