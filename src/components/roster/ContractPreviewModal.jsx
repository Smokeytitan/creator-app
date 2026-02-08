import Modal, { ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';
import { FileText, DollarSign } from 'lucide-react';
import { formatParsedDataForPreview } from '../../services/contractService';

/**
 * Modal that displays parsed contract data for review before applying.
 *
 * Shows sections: Creator Info, Pricing, Deliverables, Terms, Payment.
 */
export default function ContractPreviewModal({
  open,
  parsedContract,
  onApply,
  onCancel,
}) {
  if (!parsedContract) return null;

  const preview = formatParsedDataForPreview(parsedContract);

  return (
    <Modal open={open} onClose={onCancel} title="Review Contract Data" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Creator Info */}
        {preview.creatorInfo.length > 0 && (
          <PreviewSection
            title="Creator Information"
            icon={<FileText className="w-4 h-4 mr-2" />}
            items={preview.creatorInfo}
          />
        )}

        {/* Pricing */}
        {preview.pricing.length > 0 && (
          <PreviewSection
            title="Pricing Information"
            icon={<DollarSign className="w-4 h-4 mr-2" />}
            items={preview.pricing}
            showPlatforms
          />
        )}

        {/* Deliverables */}
        {preview.deliverables.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Deliverables</h3>
            <div className="grid grid-cols-2 gap-3">
              {preview.deliverables.map((item, idx) => (
                <PreviewItem key={idx} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Contract Terms */}
        {preview.terms.length > 0 && (
          <PreviewSection title="Contract Terms" items={preview.terms} />
        )}

        {/* Payment */}
        {preview.payment.length > 0 && (
          <PreviewSection title="Payment Terms" items={preview.payment} />
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-[var(--color-border)]">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button variant="primary" onClick={onApply} className="flex-1">
          Apply Contract Data
        </Button>
      </div>
    </Modal>
  );
}

function PreviewSection({ title, icon, items, showPlatforms = false }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
        {icon}
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {items.map((item, idx) => (
          <PreviewItem key={idx} item={item} showPlatforms={showPlatforms} />
        ))}
      </div>
    </div>
  );
}

function PreviewItem({ item, showPlatforms = false }) {
  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-3">
      <div className="text-xs text-[var(--color-text-secondary)] mb-1">{item.label}</div>
      <div className="text-sm text-[var(--color-text-primary)] font-medium">{item.value}</div>
      {showPlatforms && item.platforms && (
        <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
          Platforms: {item.platforms}
        </div>
      )}
    </div>
  );
}
