import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripSelectorProps {
  trips: any[];
  currentTripIndex: number;
  onTripChange: (index: number) => void;
  onAddTrip: () => void;
  onRemoveTrip: (index: number) => void;
  getTripLabel: (index: number) => string;
}

export function TripSelector({
  trips,
  currentTripIndex,
  onTripChange,
  onAddTrip,
  onRemoveTrip,
  getTripLabel
}: TripSelectorProps) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
      <div className="flex items-center gap-0 overflow-x-auto flex-1">
        {trips.map((_, index) => (
          <div key={index} className="">
            <div
              className={`flex items-center gap-3 px-4 py-2 whitespace-nowrap transition-all hover:cursor-pointer ${currentTripIndex === index
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}>
              <p
                onClick={() => onTripChange(index)}
              >
                {getTripLabel(index)}
              </p>
              {trips.length > 1 && currentTripIndex === index && (
                <p onClick={() => onRemoveTrip(currentTripIndex)} className="p-0 m-0 bg-white-50 hover:bg-white-50">
                  <X className="w-4 h-4 text-white-600" />
                </p>
              )}
            </div>

          </div>
        ))}
        <Button type="button" onClick={onAddTrip} size="sm" variant="outline" className="h-10 hover:bg-background hover:text-slate-800 rounded-none">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}