import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import api from '../../services/api';
import styles from './PatientCard.module.scss';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Printed via the browser's print dialog (@media print), never a generated
// PDF — see 06-design-system.md "Kartu Pasien". Rendered inline as an
// on-screen preview too; the `.print-only` class (src/styles/print.scss)
// hides everything else on the page when window.print() is triggered.
// `active` gates that class — pages with more than one printable thing
// (e.g. PatientDetail also has MedicalRecordPrint) must only mark one
// active at a time, or both would print together.
export default function PatientCard({ patient, active = true }) {
  const barcodeRef = useRef(null);
  const [clinicName, setClinicName] = useState('Medicalsia');

  useEffect(() => {
    api
      .get('/clinic-profile')
      .then(({ data }) => setClinicName(data.data.name))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (barcodeRef.current && patient?.patient_number) {
      JsBarcode(barcodeRef.current, patient.patient_number, {
        format: 'CODE128',
        displayValue: false,
        height: 40,
        margin: 0,
      });
    }
  }, [patient?.patient_number]);

  if (!patient) return null;

  return (
    <div className={`${active ? 'print-only' : ''} ${styles.card}`}>
      <div className={styles.clinicName}>{clinicName}</div>
      <div className={styles.body}>
        <div className={styles.fullName}>{patient.full_name}</div>
        <div className={styles.row}>
          <span>Tgl Lahir</span>
          <span>{formatDate(patient.dob)}</span>
        </div>
        <div className={styles.patientNumber}>{patient.patient_number}</div>
        <div className={styles.registeredAt}>Terdaftar: {formatDate(patient.created_at)}</div>
      </div>
      <svg ref={barcodeRef} className={styles.barcode}></svg>
    </div>
  );
}
