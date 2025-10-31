import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PurposeFormData {
  trip_mode: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  return_date: string;
  trip_purpose: string;
  guest_count: string;
  gl_code: string;
  io: string;
}

interface PurposeTabProps {
  data: PurposeFormData;
  onChange: (updatedData: PurposeFormData) => void;
  onNext: () => void;
}

const PurposeTab: React.FC<PurposeTabProps> = ({ data, onChange, onNext }) => {
  const handleChange = (field: keyof PurposeFormData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleNext = () => {
    if (!data.trip_mode || !data.from_location || !data.to_location || !data.departure_date) {
      alert("Please fill all required fields before proceeding.");
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-2">Travel Purpose Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trip Mode */}
        <div>
          <Label>Trip Mode</Label>
          <Select
            value={data.trip_mode}
            onValueChange={(val) => handleChange("trip_mode", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trip mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one-way">One Way</SelectItem>
              <SelectItem value="round-trip">Round Trip</SelectItem>
              <SelectItem value="multi-city">Multi City</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* From Location */}
        <div>
          <Label>From Location</Label>
          <Input
            value={data.from_location}
            onChange={(e) => handleChange("from_location", e.target.value)}
            placeholder="Enter starting location"
          />
        </div>

        {/* To Location */}
        <div>
          <Label>To Location</Label>
          <Input
            value={data.to_location}
            onChange={(e) => handleChange("to_location", e.target.value)}
            placeholder="Enter destination"
          />
        </div>

        {/* Departure Date */}
        <div>
          <Label>Departure Date</Label>
          <Input
            type="date"
            value={data.departure_date}
            onChange={(e) => handleChange("departure_date", e.target.value)}
          />
        </div>

        {/* Return Date */}
        <div>
          <Label>Return Date</Label>
          <Input
            type="date"
            value={data.return_date}
            onChange={(e) => handleChange("return_date", e.target.value)}
          />
        </div>

        {/* Purpose */}
        <div className="md:col-span-2">
          <Label>Trip Purpose</Label>
          <Input
            value={data.trip_purpose}
            onChange={(e) => handleChange("trip_purpose", e.target.value)}
            placeholder="e.g., Client Meeting, Training, Conference"
          />
        </div>

        {/* Guest Count */}
        <div>
          <Label>Guest Count</Label>
          <Input
            type="number"
            min="0"
            value={data.guest_count}
            onChange={(e) => handleChange("guest_count", e.target.value)}
          />
        </div>

        {/* GL Code */}
        <div>
          <Label>GL Code</Label>
          <Input
            value={data.gl_code}
            onChange={(e) => handleChange("gl_code", e.target.value)}
            placeholder="Enter GL Code"
          />
        </div>

        {/* IO */}
        <div>
          <Label>IO (Internal Order)</Label>
          <Input
            value={data.io}
            onChange={(e) => handleChange("io", e.target.value)}
            placeholder="Enter IO"
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleNext}>Next: Ticketing</Button>
      </div>
    </div>
  );
};

export default PurposeTab;
