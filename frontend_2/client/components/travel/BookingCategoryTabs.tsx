import { Plane, Hotel, Car, IndianRupeeIcon, MapPin } from 'lucide-react';

interface BookingCategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: 'trip_info', label: 'Trip', icon: MapPin },
  { id: 'ticketing', label: 'Ticketing', icon: Plane },
  { id: 'accommodation', label: 'Accommodation', icon: Hotel },
  { id: 'conveyance', label: 'Conveyance', icon: Car },
  { id: 'advance', label: 'Travel Advance', icon: IndianRupeeIcon }
];

export function BookingCategoryTabs({ activeCategory, onCategoryChange }: BookingCategoryTabsProps) {
  return (
    <div className="flex flex-col gap-0 h-auto border-r border-slate-200">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`flex items-center gap-2 px-4 py-4 transition-all ${
              activeCategory === cat.id
                ? 'bg-slate-100 border-indigo-600 font-medium'
                : 'hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}