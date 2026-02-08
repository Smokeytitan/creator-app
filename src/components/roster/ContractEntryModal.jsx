import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Modal for manual contract data entry / editing.
 *
 * All contract fields: legalName, address, city, pincode, country,
 * businessName, email, network, currency, walletAddress, costPerPost, poNumber.
 */
export default function ContractEntryModal({
  open,
  data,
  setData,
  onSave,
  onCancel,
}) {
  const update = (field, value) => setData({ ...data, [field]: value });

  const inputClass =
    'w-full px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]';

  return (
    <Modal open={open} onClose={onCancel} title="Contract Details" maxWidth="max-w-2xl">
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        Enter or update contract information for this creator.
      </p>

      <div className="space-y-4">
        {/* Legal Name */}
        <Field label="Legal Name">
          <input
            type="text"
            value={data.legalName}
            onChange={(e) => update('legalName', e.target.value)}
            className={inputClass}
            placeholder="Enter legal name"
          />
        </Field>

        {/* Legal Address */}
        <Field label="Legal Address">
          <textarea
            value={data.legalAddress}
            onChange={(e) => update('legalAddress', e.target.value)}
            className={inputClass}
            placeholder="Enter street address"
            rows="2"
          />
        </Field>

        {/* City / Pincode / Country */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="City">
            <input
              type="text"
              value={data.city}
              onChange={(e) => update('city', e.target.value)}
              className={inputClass}
              placeholder="City"
            />
          </Field>
          <Field label="Pincode">
            <input
              type="text"
              value={data.pincode}
              onChange={(e) => update('pincode', e.target.value)}
              className={inputClass}
              placeholder="Zip/Pincode"
            />
          </Field>
          <Field label="Country">
            <input
              type="text"
              value={data.country}
              onChange={(e) => update('country', e.target.value)}
              className={inputClass}
              placeholder="Country"
            />
          </Field>
        </div>

        {/* Business Name */}
        <Field label="Business Name (if applicable)">
          <input
            type="text"
            value={data.businessName}
            onChange={(e) => update('businessName', e.target.value)}
            className={inputClass}
            placeholder="Enter business name"
          />
        </Field>

        {/* Email */}
        <Field label="Email">
          <input
            type="email"
            value={data.email}
            onChange={(e) => update('email', e.target.value)}
            className={inputClass}
            placeholder="creator@example.com"
          />
        </Field>

        {/* Network / Currency */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Network">
            <input
              type="text"
              value={data.network}
              onChange={(e) => update('network', e.target.value)}
              className={inputClass}
              placeholder="e.g., Ethereum, Bitcoin, etc."
            />
          </Field>
          <Field label="Currency">
            <input
              type="text"
              value={data.currency}
              onChange={(e) => update('currency', e.target.value)}
              className={inputClass}
              placeholder="USD"
            />
          </Field>
        </div>

        {/* Wallet Address */}
        <Field label="Wallet Address (cryptocurrency)">
          <input
            type="text"
            value={data.walletAddress}
            onChange={(e) => update('walletAddress', e.target.value)}
            className={inputClass}
            placeholder="0x... or crypto wallet address"
          />
        </Field>

        {/* Cost Per Post / PO Number */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cost Per Post">
            <input
              type="text"
              value={data.costPerPost}
              onChange={(e) => update('costPerPost', e.target.value)}
              className={inputClass}
              placeholder="$500"
            />
          </Field>
          <Field label="PO Number">
            <input
              type="text"
              value={data.poNumber}
              onChange={(e) => update('poNumber', e.target.value)}
              className={inputClass}
              placeholder="PO-12345"
            />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button variant="primary" onClick={onSave} className="flex-1">
          Save Contract Data
        </Button>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
