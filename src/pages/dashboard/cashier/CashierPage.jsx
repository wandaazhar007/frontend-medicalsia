import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2, FileText, Pencil, Printer, RotateCcw, Trash2, UserCheck, Wallet, X } from 'lucide-react';
import { listPatients } from '../../../services/patients';
import { listCompletedAppointments } from '../../../services/appointments';
import { listPrescriptions } from '../../../services/prescriptions';
import { listProcedureRecords } from '../../../services/procedureRecords';
import { listServices } from '../../../services/services';
import { createInvoice, getInvoice, payInvoice } from '../../../services/invoices';
import { listShortfalls, resolveShortfall } from '../../../services/shortfalls';
import Card from '../../../components/Card/Card';
import Input from '../../../components/Input/Input';
import Select from '../../../components/Select/Select';
import Button from '../../../components/Button/Button';
import Badge from '../../../components/Badge/Badge';
import EmptyState from '../../../components/EmptyState/EmptyState';
import SearchableSelect from '../../../components/SearchableSelect/SearchableSelect';
import ReceiptPrint from '../../../components/ReceiptPrint/ReceiptPrint';
import Modal from '../../../components/Modal/Modal';
import styles from './CashierPage.module.scss';

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

// Local date, not toISOString() — avoids the day flipping around midnight
// in timezones ahead of UTC (same reasoning as AppointmentsList).
function getTodayDateInputValue() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Strips everything but digits, then re-inserts thousand separator dots as
// the cashier types — e.g. "100000" -> "100.000". Mirrors the phone number
// live-formatting pattern in PatientForm.jsx.
function formatRupiahInput(value) {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

function parseRupiahInput(value) {
  return Number(value.replace(/\D/g, '')) || 0;
}

function formatTime(value) {
  const d = new Date(value);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// A service named "Konsultasi ..." is billed as item_type 'consultation',
// anything else picked from the same `services` catalog as 'service' — the
// schema doesn't have a category field on `services` itself to distinguish
// them any other way.
function serviceItemType(name) {
  return /konsultasi/i.test(name) ? 'consultation' : 'service';
}

export default function CashierPage() {
  const { t } = useTranslation();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [pendingPrescription, setPendingPrescription] = useState(null);
  const [includedItemIds, setIncludedItemIds] = useState(new Set());
  const [pendingProcedureRecord, setPendingProcedureRecord] = useState(null);
  const [includedProcedureItemIds, setIncludedProcedureItemIds] = useState(new Set());
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paidInvoice, setPaidInvoice] = useState(null);
  // A counter, not a boolean — clicking "Cetak Struk" again must still
  // change this value so the print effect below fires again.
  const [printCount, setPrintCount] = useState(0);

  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  // Set only once payment is confirmed, so the paid-success card can still
  // show how much change was owed after the modal closes.
  const [changeGiven, setChangeGiven] = useState(null);

  const [shortfalls, setShortfalls] = useState([]);

  const [completedDate, setCompletedDate] = useState(getTodayDateInputValue);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [isLoadingCompleted, setIsLoadingCompleted] = useState(false);

  async function fetchShortfalls() {
    const { data } = await listShortfalls({ status: 'pending' });
    setShortfalls(data);
  }

  async function fetchCompletedAppointments(date) {
    setIsLoadingCompleted(true);
    try {
      const { data } = await listCompletedAppointments({ date, limit: 100 });
      setCompletedAppointments(data);
    } finally {
      setIsLoadingCompleted(false);
    }
  }

  useEffect(() => {
    fetchShortfalls();
  }, []);

  useEffect(() => {
    fetchCompletedAppointments(completedDate);
  }, [completedDate]);

  useEffect(() => {
    if (printCount > 0) window.print();
  }, [printCount]);

  const loadPatientOptions = useCallback(async (query) => {
    if (!query) return [];
    const { data } = await listPatients({ search: query, limit: 10 });
    return data.map((patient) => ({ id: patient.id, label: `${patient.full_name} (${patient.patient_number})`, raw: patient }));
  }, []);

  const loadServiceOptions = useCallback(async (query) => {
    const { data } = await listServices({ search: query, limit: 20 });
    return data.map((service) => ({ id: service.id, label: `${service.name} — ${formatCurrency(service.price)}`, raw: service }));
  }, []);

  async function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    setPendingPrescription(null);
    setIncludedItemIds(new Set());
    setPendingProcedureRecord(null);
    setIncludedProcedureItemIds(new Set());
    setCart([]);
    setError('');

    const { data } = await listPrescriptions({ patient_id: patient.id, status: 'pending' });
    const prescription = data[0] || null;
    setPendingPrescription(prescription);
    if (prescription) {
      setIncludedItemIds(new Set(prescription.items.filter((item) => !item.is_out_of_stock).map((item) => item.id)));
    }

    const { data: procedureData } = await listProcedureRecords({ patient_id: patient.id, status: 'pending' });
    const procedureRecord = procedureData[0] || null;
    setPendingProcedureRecord(procedureRecord);
    if (procedureRecord) {
      setIncludedProcedureItemIds(new Set(procedureRecord.items.map((item) => item.id)));
    }
  }

  function toggleIncluded(itemId) {
    setIncludedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function toggleProcedureIncluded(itemId) {
    setIncludedProcedureItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function handleAddService(option) {
    const service = option.raw;
    setCart((prev) => [
      ...prev,
      {
        key: `${service.id}-${Date.now()}`,
        item_type: serviceItemType(service.name),
        reference_id: service.id,
        description: service.name,
        price: service.price,
        quantity: 1,
      },
    ]);
  }

  function updateCartQuantity(key, quantity) {
    setCart((prev) => prev.map((item) => (item.key === key ? { ...item, quantity: Math.max(1, quantity) } : item)));
  }

  function removeCartItem(key) {
    setCart((prev) => prev.filter((item) => item.key !== key));
  }

  const prescriptionInvoiceItems = pendingPrescription
    ? pendingPrescription.items
        .filter((item) => includedItemIds.has(item.id))
        .map((item) => ({
          item_type: 'medicine',
          reference_id: item.medicine_id,
          description: item.medicine_name,
          price: item.price,
          quantity: item.quantity,
        }))
    : [];

  const procedureInvoiceItems = pendingProcedureRecord
    ? pendingProcedureRecord.items
        .filter((item) => includedProcedureItemIds.has(item.id))
        .map((item) => ({
          item_type: 'procedure',
          reference_id: item.medical_procedure_id,
          description: item.procedure_name,
          price: item.price,
          quantity: item.quantity,
        }))
    : [];

  const allItems = [...cart.map(({ key, ...rest }) => rest), ...prescriptionInvoiceItems, ...procedureInvoiceItems];
  const total = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleCreateInvoice() {
    setError('');
    if (allItems.length === 0) {
      setError(t('cashierPage.addItemsError'));
      return;
    }

    const excludedIds = pendingPrescription
      ? pendingPrescription.items.filter((item) => !includedItemIds.has(item.id)).map((item) => item.id)
      : [];
    const excludedProcedureIds = pendingProcedureRecord
      ? pendingProcedureRecord.items.filter((item) => !includedProcedureItemIds.has(item.id)).map((item) => item.id)
      : [];

    setIsSubmitting(true);
    try {
      const { data } = await createInvoice({
        patient_id: selectedPatient.id,
        prescription_id: pendingPrescription?.id || null,
        procedure_record_id: pendingProcedureRecord?.id || null,
        items: allItems,
        excluded_prescription_item_ids: excludedIds,
        excluded_procedure_item_ids: excludedProcedureIds,
      });
      setDraftInvoice(data);
    } catch {
      setError(t('cashierPage.createInvoiceError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePay() {
    setError('');
    setIsPaying(true);
    try {
      await payInvoice(draftInvoice.id, paymentMethod);
      const { data } = await getInvoice(draftInvoice.id);
      setPaidInvoice(data);
    } catch {
      setError(t('cashierPage.markPaidError'));
    } finally {
      setIsPaying(false);
    }
  }

  // Cash payments need the change calculated before the invoice is marked
  // paid — other methods (debit/credit/QRIS) settle for the exact amount,
  // so they skip straight to handlePay.
  function handleMarkPaidClick() {
    if (paymentMethod === 'cash') {
      setCashReceived('');
      setShowCashModal(true);
      return;
    }
    handlePay();
  }

  async function handleConfirmCashPay() {
    setChangeGiven(parseRupiahInput(cashReceived) - total);
    setShowCashModal(false);
    await handlePay();
  }

  const cashReceivedNumber = parseRupiahInput(cashReceived);
  const changeDue = cashReceivedNumber - total;

  function handleReset() {
    setSelectedPatient(null);
    setPendingPrescription(null);
    setIncludedItemIds(new Set());
    setPendingProcedureRecord(null);
    setIncludedProcedureItemIds(new Set());
    setCart([]);
    setDraftInvoice(null);
    setPaymentMethod('');
    setPaidInvoice(null);
    setPrintCount(0);
    setError('');
    setCashReceived('');
    setChangeGiven(null);
  }

  async function handleResolveShortfall(id) {
    await resolveShortfall(id);
    fetchShortfalls();
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{t('cashierPage.title')}</h1>

      {!paidInvoice && !selectedPatient && (
        <Card>
          <div className={styles.completedHeader}>
            <div className={styles.sectionTitle}>{t('cashierPage.completedTitle')}</div>
            <Input
              type="date"
              label={t('cashierPage.completedDateLabel')}
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
            />
          </div>
          {isLoadingCompleted ? (
            <EmptyState message={t('cashierPage.saving')} />
          ) : completedAppointments.length === 0 ? (
            <EmptyState message={t('cashierPage.completedEmpty')} />
          ) : (
            <table className={styles.completedTable}>
              <thead>
                <tr>
                  <th>{t('cashierPage.completedColumnPatient')}</th>
                  <th>{t('cashierPage.completedColumnDoctor')}</th>
                  <th>{t('cashierPage.completedColumnTime')}</th>
                  <th>{t('cashierPage.completedColumnAction')}</th>
                </tr>
              </thead>
              <tbody>
                {completedAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td>{appointment.patient_name} ({appointment.patient_number})</td>
                    <td>{appointment.doctor_name || '-'}</td>
                    <td>{formatTime(appointment.completed_at)}</td>
                    <td>
                      <Button
                        variant="secondary"
                        onClick={() =>
                          handleSelectPatient({
                            id: appointment.patient_id,
                            full_name: appointment.patient_name,
                            patient_number: appointment.patient_number,
                          })
                        }
                      >
                        <UserCheck size={14} />
                        {t('cashierPage.selectPatient')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {!paidInvoice && (
        <Card>
          <div className={styles.sectionTitle}>{t('cashierPage.createInvoiceTitle')}</div>
          {error && <div className={styles.error}>{error}</div>}

          {!selectedPatient ? (
            <SearchableSelect
              label={t('cashierPage.searchPatientLabel')}
              placeholder={t('cashierPage.searchPatientPlaceholder')}
              loadOptions={loadPatientOptions}
              onSelect={(option) => handleSelectPatient(option.raw)}
              emptyMessage={t('cashierPage.searchPatientEmpty')}
            />
          ) : (
            <div className={styles.checkboxLabel}>
              <strong>{selectedPatient.full_name} ({selectedPatient.patient_number})</strong>
              {!draftInvoice && (
                <Button variant="ghost" onClick={() => setSelectedPatient(null)}>
                  <Pencil size={14} />
                  {t('cashierPage.change')}
                </Button>
              )}
            </div>
          )}

          {selectedPatient && (
            <>
              {pendingPrescription && pendingPrescription.items.length > 0 && (
                <div>
                  <div className={styles.sectionTitle}>{t('cashierPage.pendingPrescriptionTitle')}</div>
                  {pendingPrescription.items.map((item) => (
                    <div key={item.id} className={styles.prescriptionItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={includedItemIds.has(item.id)}
                          onChange={() => toggleIncluded(item.id)}
                          disabled={Boolean(draftInvoice)}
                        />
                        <span className={styles.prescriptionItemInfo}>
                          {item.medicine_name} ({item.quantity}x)
                          {item.is_out_of_stock && <Badge variant="danger">{t('cashierPage.outOfStock')}</Badge>}
                        </span>
                      </label>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              {pendingProcedureRecord && pendingProcedureRecord.items.length > 0 && (
                <div>
                  <div className={styles.sectionTitle}>{t('cashierPage.pendingProcedureTitle')}</div>
                  {pendingProcedureRecord.items.map((item) => (
                    <div key={item.id} className={styles.prescriptionItem}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={includedProcedureItemIds.has(item.id)}
                          onChange={() => toggleProcedureIncluded(item.id)}
                          disabled={Boolean(draftInvoice)}
                        />
                        <span className={styles.prescriptionItemInfo}>
                          {item.procedure_name} ({item.quantity}x)
                        </span>
                      </label>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className={styles.sectionTitle}>{t('cashierPage.serviceCostTitle')}</div>
                {!draftInvoice && (
                  <SearchableSelect
                    placeholder={t('cashierPage.searchServicePlaceholder')}
                    loadOptions={loadServiceOptions}
                    onSelect={handleAddService}
                    emptyMessage={t('cashierPage.searchServiceEmpty')}
                  />
                )}
                {cart.map((item) => (
                  <div key={item.key} className={styles.cartItem}>
                    <span>{item.description}</span>
                    <div className={styles.actions}>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateCartQuantity(item.key, parseInt(e.target.value, 10) || 1)}
                        disabled={Boolean(draftInvoice)}
                      />
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                      {!draftInvoice && (
                        <Button variant="ghost" onClick={() => removeCartItem(item.key)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>{t('cashierPage.total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>

              {!draftInvoice ? (
                <Button onClick={handleCreateInvoice} disabled={isSubmitting}>
                  <FileText size={14} />
                  {isSubmitting ? t('cashierPage.saving') : t('cashierPage.createInvoice')}
                </Button>
              ) : (
                <div className={styles.payRow}>
                  <Select label={t('cashierPage.paymentMethodLabel')} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="">{t('cashierPage.selectMethod')}</option>
                    <option value="cash">{t('cashierPage.cash')}</option>
                    <option value="debit_card">{t('cashierPage.debitCard')}</option>
                    <option value="credit_card">{t('cashierPage.creditCard')}</option>
                    <option value="qris">{t('cashierPage.qris')}</option>
                  </Select>
                  <Button onClick={handleMarkPaidClick} disabled={!paymentMethod || isPaying}>
                    <Wallet size={14} />
                    {isPaying ? t('cashierPage.processing') : t('cashierPage.markPaid')}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {paidInvoice && (
        <Card>
          <div className={styles.success}>{t('cashierPage.paidSuccess')}</div>
          {changeGiven !== null && (
            <div className={styles.totalRow}>
              <span>{t('cashierPage.changeLabel')}</span>
              <span>{formatCurrency(changeGiven)}</span>
            </div>
          )}
          <div className={styles.actions}>
            <Button onClick={() => setPrintCount((c) => c + 1)}>
              <Printer size={14} />
              {t('cashierPage.printReceipt')}
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw size={14} />
              {t('cashierPage.newTransaction')}
            </Button>
          </div>
        </Card>
      )}

      {paidInvoice && <ReceiptPrint invoice={paidInvoice} active={printCount > 0} />}

      <Card>
        <div className={styles.sectionTitle}>{t('cashierPage.pendingRefundTitle')}</div>
        {shortfalls.length === 0 ? (
          <EmptyState message={t('cashierPage.noPendingRefund')} />
        ) : (
          shortfalls.map((shortfall) => (
            <div key={shortfall.id} className={styles.shortfallItem}>
              <span>
                {shortfall.patient_name} — {shortfall.medicine_name} ({shortfall.qty_shortfall}x) — {formatCurrency(shortfall.refund_amount)}
              </span>
              <Button variant="secondary" onClick={() => handleResolveShortfall(shortfall.id)}>
                <CheckCircle2 size={14} />
                {t('cashierPage.markResolved')}
              </Button>
            </div>
          ))
        )}
      </Card>

      <Modal isOpen={showCashModal} onClose={() => setShowCashModal(false)} title={t('cashierPage.cashCalcTitle')}>
        <div className={styles.cashCalc}>
          <div className={styles.totalRow}>
            <span>{t('cashierPage.total')}</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            label={t('cashierPage.cashReceivedLabel')}
            value={cashReceived}
            onChange={(e) => setCashReceived(formatRupiahInput(e.target.value))}
            autoFocus
          />
          <div className={styles.totalRow}>
            <span>{t('cashierPage.changeLabel')}</span>
            <span className={changeDue < 0 ? styles.changeNegative : undefined}>{formatCurrency(Math.max(changeDue, 0))}</span>
          </div>
          {changeDue < 0 && <div className={styles.error}>{t('cashierPage.cashInsufficientError')}</div>}
          <div className={styles.actions}>
            <Button onClick={handleConfirmCashPay} disabled={changeDue < 0 || isPaying}>
              <Check size={14} />
              {isPaying ? t('cashierPage.processing') : t('cashierPage.confirmPay')}
            </Button>
            <Button variant="ghost" onClick={() => setShowCashModal(false)}>
              <X size={14} />
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
