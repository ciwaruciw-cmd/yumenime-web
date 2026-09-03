import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface AgeVerificationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 18+ Age Verification Warning Alert Modal for adult/hentai content.
 */
export function AgeVerificationModal({ isOpen, onConfirm, onCancel }: AgeVerificationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      showCloseButton={false}
      className="text-center mx-auto"
    >
      <div className="flex flex-col items-center justify-center text-center py-2 space-y-4">
        {/* 18+ Icon */}
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border-2 border-red-500/40 flex items-center justify-center text-red-500 font-mono font-bold text-2xl tracking-tight shadow-lg shadow-red-500/10">
          18+
        </div>

        {/* Title & Warning Message */}
        <div className="space-y-1.5 max-w-xs mx-auto text-center">
          <h3 className="text-base md:text-lg font-display text-ink font-semibold">
            Adult Content Warning
          </h3>
          <p className="text-xs text-mute font-display leading-relaxed">
            The <span className="text-red-400 font-semibold">Hentai</span> genre contains explicit content intended exclusively for viewers aged 18 and older.
          </p>
          <p className="text-xs font-display text-body font-medium pt-1">
            Are you 18 years of age or older and wish to continue?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center justify-center gap-3 w-full pt-3">
          <Button
            variant="outline"
            size="md"
            className="flex-1 text-xs justify-center"
            onClick={onCancel}
          >
            No / Go Back
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1 text-xs justify-center bg-red-600 hover:bg-red-500 border-red-600 text-white font-semibold"
            onClick={onConfirm}
          >
            Yes, I'm 18+
          </Button>
        </div>
      </div>
    </Modal>
  );
}
