import { useCallback, useEffect, useState } from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { listPatients } from '../../../services/patients';
import { listPrescriptions } from '../../../services/prescriptions';
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
import styles from './CashierPage.module.scss';

function formatCurrency(value) {
  return `Rp${Number(value).toLocaleString('id-ID')}`;
}

// A service named "Konsultasi ..." is billed as item_type 'consultation',
// anything else picked from the same `services` catalog as 'service' — the
// schema doesn't have a category field on `services` itself to distinguish
// them any other way.
function serviceItemType(name) {
  return /konsultasi/i.test(name) ? 'consultation' : 'service';
}

export default function CashierPage() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [pendingPrescription, setPendingPrescription] = useState(null);
  const [includedItemIds, setIncludedItemIds] = useState(new Set());
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

  const [shortfalls, setShortfalls] = useState([]);

  async function fetchShortfalls() {
    const { data } = await listShortfalls({ status: 'pending' });
    setShortfalls(data);
  }

  useEffect(() => {
    fetchShortfalls();
  }, []);

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

  async function handleSelectPatient(option) {
    const patient = option.raw;
    setSelectedPatient(patient);
    setPendingPrescription(null);
    setIncludedItemIds(new Set());
    setCart([]);
    setError('');

    const { data } = await listPrescriptions({ patient_id: patient.id, status: 'pending' });
    const prescription = data[0] || null;
    setPendingPrescription(prescription);
    if (prescription) {
      setIncludedItemIds(new Set(prescription.items.filter((item) => !item.is_out_of_stock).map((item) => item.id)));
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

  const allItems = [...cart.map(({ key, ...rest }) => rest), ...prescriptionInvoiceItems];
  const total = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleCreateInvoice() {
    setError('');
    if (allItems.length === 0) {
      setError('Tambahkan minimal satu item (layanan atau obat) sebelum membuat invoice.');
      return;
    }

    const excludedIds = pendingPrescription
      ? pendingPrescription.items.filter((item) => !includedItemIds.has(item.id)).map((item) => item.id)
      : [];

    setIsSubmitting(true);
    try {
      const { data } = await createInvoice({
        patient_id: selectedPatient.id,
        prescription_id: pendingPrescription?.id || null,
        items: allItems,
        excluded_prescription_item_ids: excludedIds,
      });
      setDraftInvoice(data);
    } catch {
      setError('Gagal membuat invoice.');
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
      setError('Gagal menandai invoice lunas.');
    } finally {
      setIsPaying(false);
    }
  }

  function handleReset() {
    setSelectedPatient(null);
    setPendingPrescription(null);
    setIncludedItemIds(new Set());
    setCart([]);
    setDraftInvoice(null);
    setPaymentMethod('');
    setPaidInvoice(null);
    setPrintCount(0);
    setError('');
  }

  async function handleResolveShortfall(id) {
    await resolveShortfall(id);
    fetchShortfalls();
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Kasir</h1>

      {!paidInvoice && (
        <Card>
          <div className={styles.sectionTitle}>Buat Invoice</div>
          {error && <div className={styles.error}>{error}</div>}

          {!selectedPatient ? (
            <SearchableSelect
              label="Cari Pasien"
              placeholder="Cari nama, NIK, atau nomor pasien..."
              loadOptions={loadPatientOptions}
              onSelect={handleSelectPatient}
              emptyMessage="Ketik untuk mencari pasien."
            />
          ) : (
            <div className={styles.checkboxLabel}>
              <strong>{selectedPatient.full_name} ({selectedPatient.patient_number})</strong>
              {!draftInvoice && <Button variant="ghost" onClick={() => setSelectedPatient(null)}>Ubah</Button>}
            </div>
          )}

          {selectedPatient && (
            <>
              {pendingPrescription && pendingPrescription.items.length > 0 && (
                <div>
                  <div className={styles.sectionTitle}>Resep Menunggu Pembayaran</div>
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
                          {item.is_out_of_stock && <Badge variant="danger">Stok Habis</Badge>}
                        </span>
                      </label>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className={styles.sectionTitle}>Biaya Konsultasi / Layanan</div>
                {!draftInvoice && (
                  <SearchableSelect
                    placeholder="Cari layanan..."
                    loadOptions={loadServiceOptions}
                    onSelect={handleAddService}
                    emptyMessage="Ketik untuk mencari layanan."
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
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>

              {!draftInvoice ? (
                <Button onClick={handleCreateInvoice} disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Buat Invoice'}
                </Button>
              ) : (
                <div className={styles.payRow}>
                  <Select label="Metode Pembayaran" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="">Pilih metode</option>
                    <option value="cash">Tunai</option>
                    <option value="debit_card">Kartu Debit</option>
                    <option value="credit_card">Kartu Kredit</option>
                    <option value="qris">QRIS</option>
                  </Select>
                  <Button onClick={handlePay} disabled={!paymentMethod || isPaying}>
                    {isPaying ? 'Memproses...' : 'Tandai Lunas'}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {paidInvoice && (
        <Card>
          <div className={styles.success}>Invoice lunas. Pembayaran tercatat.</div>
          <div className={styles.actions}>
            <Button onClick={() => setPrintCount((c) => c + 1)}>
              <Printer size={16} />
              Cetak Struk
            </Button>
            <Button variant="ghost" onClick={handleReset}>Transaksi Baru</Button>
          </div>
        </Card>
      )}

      {paidInvoice && <ReceiptPrint invoice={paidInvoice} active={printCount > 0} />}

      <Card>
        <div className={styles.sectionTitle}>Refund Tertunda</div>
        {shortfalls.length === 0 ? (
          <EmptyState message="Tidak ada refund tertunda." />
        ) : (
          shortfalls.map((shortfall) => (
            <div key={shortfall.id} className={styles.shortfallItem}>
              <span>
                {shortfall.patient_name} — {shortfall.medicine_name} ({shortfall.qty_shortfall}x) — {formatCurrency(shortfall.refund_amount)}
              </span>
              <Button variant="secondary" onClick={() => handleResolveShortfall(shortfall.id)}>Tandai Selesai</Button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
