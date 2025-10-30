import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface BasicInfoFormProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  glCodes: any;
  onNext: () => void;
}

export function BasicInfoForm({ formData, onChange, glCodes, onNext }: BasicInfoFormProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="purpose">Purpose of Travel *</Label>
          <Textarea
            id="purpose"
            value={formData.purpose}
            onChange={(e) => onChange('purpose', e.target.value)}
            placeholder="Describe the purpose of your travel..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internal_order">Internal Order (IO) *</Label>
          <Input
            id="internal_order"
            value={formData.internal_order}
            onChange={(e) => onChange('internal_order', e.target.value)}
            placeholder="Enter IO number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sanction_number">Sanction Number *</Label>
          <Input
            id="sanction_number"
            value={formData.sanction_number}
            onChange={(e) => onChange('sanction_number', e.target.value)}
            placeholder="Enter sanction number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="general_ledger">GL Code *</Label>
          <Select
            value={formData.general_ledger}
            onValueChange={(value) => onChange('general_ledger', value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select GL Code" />
            </SelectTrigger>
            <SelectContent>
              {glCodes?.results?.map((gl: any) => (
                <SelectItem key={gl.id} value={gl.id.toString()}>
                  {gl.gl_code} - {gl.vertical_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" onClick={onNext}>
          Next: Trip Details
        </Button>
      </div>
    </div>
  );
}