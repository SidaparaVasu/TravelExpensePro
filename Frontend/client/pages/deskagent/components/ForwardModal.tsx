import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { BookingAgent } from '@/src/types/travel-desk.types';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (agentId: number, note: string) => void;
  title: string;
  agents: BookingAgent[];
  isLoading?: boolean;
  type?: 'forward' | 'reassign';
}

export const ForwardModal: React.FC<ForwardModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  agents,
  isLoading,
  type = 'forward',
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedAgent) {
      setError('Please select a booking agent');
      return;
    }
    setError(null);
    onConfirm(parseInt(selectedAgent, 10), note);
  };

  const handleClose = () => {
    setSelectedAgent('');
    setNote('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleClose}>
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent">Select Booking Agent *</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger id="agent" className={`h-10 ${error && !selectedAgent ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.organization_name} - ({agent.full_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && !selectedAgent && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional instructions..."
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : type === 'forward' ? 'Forward' : 'Reassign'}
          </Button>
        </div>
      </div>
    </div>
  );
};
