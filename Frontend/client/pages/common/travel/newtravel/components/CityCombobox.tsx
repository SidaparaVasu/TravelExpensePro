import React, { useState, useMemo } from "react";
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from "@headlessui/react";
import { cn } from "@/lib/utils";
import { MapPin, Check } from "lucide-react";

interface City {
  id: number;
  city_name: string;
  state_name?: string;
  country_name?: string;
}

interface CityComboboxProps {
  label: string;
  required?: boolean;
  cities: City[];
  value: number | null;
  displayValue: string;
  onChange: (id: number | null, label: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const CityCombobox: React.FC<CityComboboxProps> = ({
  label,
  required,
  cities,
  value,
  displayValue,
  onChange,
  error,
  placeholder = "Search city...",
  disabled,
}) => {
  const [query, setQuery] = useState("");

  const filteredCities = useMemo(() => {
    if (!query) return cities.slice(0, 20);
    return cities.filter((city) => {
      // const searchStr = `${city.city_name} ${city.state_name} ${city.country_name}`.toLowerCase();
      const searchStr = `${city.city_name} ${city.state_name || ""} ${city.country_name || ""}`.toLowerCase();
      return searchStr.includes(query.toLowerCase());
    }).slice(0, 20);
  }, [cities, query]);

  const selectedCity = useMemo(() => {
    return cities.find((c) => c.id === value) || null;
  }, [cities, value]);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Combobox
        value={selectedCity}
        onChange={(city) => {
          if (city) {
            const location = [city.state_name, city.country_name].filter(Boolean).join(", ");
            onChange(city.id, location ? `${city.city_name} (${location})` : city.city_name);
          } else {
            onChange(null, "");
          }
        }}
        disabled={disabled}
      >
        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <ComboboxInput
              className={cn(
                "w-full pl-10 pr-3 py-2.5 rounded-lg border bg-card text-card-foreground transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "placeholder:text-muted-foreground",
                error
                  ? "border-destructive focus:ring-destructive/50 focus:border-destructive"
                  : "border-input hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed bg-muted"
              )}
              displayValue={(city: City | null) => {
                if (!city) return displayValue;
                const location = [city.state_name, city.country_name].filter(Boolean).join(", ");
                return location ? `${city.city_name} (${location})` : city.city_name;
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value) {
                  onChange(null, "");
                }
              }}
              placeholder={placeholder}
            />
          </div>

          <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-popover border border-border shadow-lg">
            {filteredCities.length === 0 && query !== "" ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">No cities found</div>
            ) : (
              filteredCities.map((city) => (
                <ComboboxOption
                  key={city.id}
                  value={city}
                  className={({ active, selected }) =>
                    cn(
                      "relative cursor-pointer select-none px-4 py-2.5 transition-colors",
                      active && "bg-primary/10",
                      selected && "bg-primary/5"
                    )
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={cn("block font-medium", selected && "text-primary")}>
                          {city.city_name}
                        </span>
                        {(city.state_name || city.country_name) && (
                          <span className="block text-xs text-muted-foreground">
                            {[city.state_name, city.country_name].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                      {selected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      {error && (
        <p className="text-sm text-destructive font-medium animate-fade-in">{error}</p>
      )}
    </div>
  );
};