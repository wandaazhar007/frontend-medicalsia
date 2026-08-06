import { useEffect, useState } from 'react';
import api from '../../services/api';
import styles from './MedicalRecordPrint.module.scss';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Printed via window.print() (@media print), never a generated PDF — see
// 06-design-system.md "Cetak Rekam Medis". `active` gates the `print-only`
// class so it doesn't print alongside PatientCard on the same page.
export default function MedicalRecordPrint({ patient, records, printedBy, active }) {
  const [clinic, setClinic] = useState(null);

  useEffect(() => {
    api
      .get('/clinic-profile')
      .then(({ data }) => setClinic(data.data))
      .catch(() => {});
  }, []);

  return (
    <div className={`${active ? 'print-only' : ''} ${styles.document}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.clinicName}>{clinic?.name || 'Medicalsia'}</div>
          <div className={styles.clinicDetails}>{clinic?.address}</div>
          <div className={styles.clinicDetails}>{clinic?.phone}</div>
        </div>
      </div>

      <h1 className={styles.docTitle}>Ringkasan Rekam Medis</h1>

      <div className={styles.patientInfo}>
        <div>
          <div className={styles.patientLabel}>Nama Lengkap</div>
          <div>{patient.full_name}</div>
        </div>
        <div>
          <div className={styles.patientLabel}>No. Pasien</div>
          <div>{patient.patient_number}</div>
        </div>
        <div>
          <div className={styles.patientLabel}>Tanggal Lahir</div>
          <div>{formatDate(patient.dob)}</div>
        </div>
        <div>
          <div className={styles.patientLabel}>NIK</div>
          <div>{patient.nik || '-'}</div>
        </div>
        <div>
          <div className={styles.patientLabel}>Alamat</div>
          <div>{patient.address || '-'}</div>
        </div>
      </div>

      {records.length === 0 ? (
        <p>Tidak ada riwayat kunjungan pada rentang tanggal ini.</p>
      ) : (
        records.map((record, index) => (
          <div key={index} className={styles.visit}>
            <div className={styles.visitHeader}>
              <span>{formatDate(record.visit_date)}</span>
              <span>{record.doctor_name || 'Dokter tidak diketahui'}</span>
            </div>
            <div className={styles.visitField}>
              <span className={styles.visitFieldLabel}>Keluhan: </span>
              {record.complaint || '-'}
            </div>
            <div className={styles.visitField}>
              <span className={styles.visitFieldLabel}>Diagnosis: </span>
              {record.diagnosis || '-'}
            </div>
            <div className={styles.visitField}>
              <span className={styles.visitFieldLabel}>Catatan: </span>
              {record.notes || '-'}
            </div>
            {record.prescription_items.length > 0 && (
              <div className={styles.medicineList}>
                <span className={styles.visitFieldLabel}>Obat: </span>
                {record.prescription_items
                  .map((item) => `${item.medicine_name} (${item.dosage || '-'}, ${item.quantity})`)
                  .join('; ')}
              </div>
            )}
          </div>
        ))
      )}

      <div className={styles.footer}>
        Dicetak pada {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
        {printedBy ? ` oleh ${printedBy}` : ''}
      </div>
    </div>
  );
}
