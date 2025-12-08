import React, { useState } from 'react';
import { X, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  bookingId: number | null;
  isLoading?: boolean;
}

export const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
  isLoading,
}) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!note.trim()) {
      setError('Please enter a note');
      return;
    }
    setError(null);
    onConfirm(note);
  };

  const handleClose = () => {
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-foreground">Add Note</h3>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-100 hover:text-slate-800" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="modal-body space-y-4">
          <p className="text-sm text-black">
            Add a note for Booking #{bookingId}
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="note">Note *</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
              className={error ? 'border-destructive' : ''}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <Button variant="outline" className='hover:bg-slate-100 hover:text-slate-800' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Note'}
          </Button>
        </div>
      </div>
    </div>
  );
};
