import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
          <Button variant="secondary" onClick={handlePrintCard}>Cetak Kartu</Button>
          <Button variant="secondary" onClick={() => navigate(`/dashboard/patients/${id}/edit`)}>Edit</Button>
        </div>
      </div>

      <Card>
        <div className={styles.infoGrid}>
          <div>
            <div className={styles.label}>No. Pasien</div>
            <div>{patient.patient_number}</div>
          </div>
          <div>
            <div className={styles.label}>NIK</div>
            <div>{patient.nik || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Tanggal Lahir</div>
            <div>{formatDate(patient.dob)}</div>
          </div>
          <div>
            <div className={styles.label}>Telepon</div>
            <div>{patient.phone || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Email</div>
            <div>{patient.email || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Alamat</div>
            <div>{patient.address || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Kelurahan / Kecamatan</div>
            <div>{[patient.village, patient.district].filter(Boolean).join(' / ') || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Kota / Provinsi</div>
            <div>{[patient.city, patient.province].filter(Boolean).join(' / ') || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Kode Pos</div>
            <div>{patient.postal_code || '-'}</div>
          </div>
          <div>
            <div className={styles.label}>Terdaftar</div>
            <div>{formatDate(patient.created_at)}</div>
          </div>
        </div>
        {patient.allergies && <p className={styles.allergies}>Alergi: {patient.allergies}</p>}
      </Card>

      <div>
        <div className={styles.recordsHeader}>
          <h2 className={styles.sectionTitle}>Riwayat Rekam Medis</h2>
          <div className={styles.printControls}>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <Button variant="secondary" onClick={handlePrintMedicalRecord} disabled={isPreparingPrint}>
              <Printer size={16} />
              {isPreparingPrint ? 'Menyiapkan...' : 'Cetak Rekam Medis'}
            </Button>
          </div>
        </div>
        {patient.medical_records.length === 0 ? (
          <EmptyState message="Belum ada riwayat rekam medis untuk pasien ini." />
        ) : (
          <Card>
            {patient.medical_records.map((record) => (
              <div key={record.id} className={styles.recordItem}>
                <span className={styles.recordDate}>
                  {formatDate(record.created_at)} — {record.doctor_name || 'Dokter tidak diketahui'}
                </span>
                <span>Keluhan: {record.complaint || '-'}</span>
                <span>Diagnosis: {record.diagnosis || '-'}</span>
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
