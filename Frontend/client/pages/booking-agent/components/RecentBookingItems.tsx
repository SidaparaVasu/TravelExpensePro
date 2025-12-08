import React from "react";
import { StatusBadge } from "./StatusBadge";
import { Plane, Train, Car, Bus, CarTaxiFront, Building2, ArrowRight } from "lucide-react";
import type { Booking } from "@/src/api/bookingAgentAPI";
import { getBookingTypeLabel } from "../utils/format";

interface RecentBookingItemProps {
  booking: Booking;
  bookingTypeLabel: string;
  onClick?: () => void;
}

const getBookingIcon = (bookingType: string) => {
  switch (bookingType.toLowerCase()) {
    case "flight":
      return <Plane className="h-5 w-5 text-blue-600" />;
    case "train":
      return <Train className="h-5 w-5 text-purple-600" />;
    case "conveyance":
      return <Car className="h-5 w-5 text-orange-600" />;
    case "car":
      return <Car className="h-5 w-5 text-orange-600" />;
    case "car at disposal":
      return <Car className="h-5 w-5 text-orange-600" />;
    case "pick-up and drop":
      return <Bus className="h-5 w-5 text-red-600" />;
    case "taxi":
        return <CarTaxiFront className="h-5 w-5 text-yellow-600" />;
    case "accommodation":
      return <Building2 className="h-5 w-5 text-green-600" />;
    default:
      return <Plane className="h-5 w-5 text-muted-foreground" />;
  }
};

const getIconBgColor = (bookingType: string) => {
  switch (bookingType.toLowerCase()) {
    case "flight":
      return "bg-blue-50";
    case "train":
      return "bg-purple-50";
    case "conveyance":
      return "bg-orange-50";  
    case "car at disposal":
      return "bg-orange-50";  
    case "car":
      return "bg-orange-50";
    case "pick-up and drop":
      return "bg-red-50";
    case "taxi":
      return "bg-yellow-50";
    case "accommodation":
      return "bg-green-50";
    default:
      return "bg-muted";
  }
};

function getRouteDisplay(booking: Booking): { from: string; to: string } {
  const details = booking.booking_details || {};
  
  if (details.from_location_name && details.to_location_name) {
    return {
      from: details.from_location_name.split(" (")[0],
      to: details.to_location_name.split(" (")[0],
    };
  }
  
  if (details.from_location && details.to_location) {
    return {
      from: String(details.from_location),
      to: String(details.to_location),
    };
  }
  
  if (details.place) {
    return { from: details.place, to: "" };
  }
  
  return { from: "—", to: "" };
}

function RecentBookingItemBase({ booking, onClick }: RecentBookingItemProps) {
  const route = getRouteDisplay(booking);
  const typeLabel = getBookingTypeLabel(booking.booking_type);

  return (
    <div
      className="flex items-center justify-between py-4 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-md transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-md ${getIconBgColor(booking.booking_type_name)}`}
        >
          {getBookingIcon(booking.booking_type_name)}
        </div>
        <div>
          <h4 className="text-base font-medium text-foreground">{typeLabel}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{route.from}</span>
            {route.to && (
              <>
                <ArrowRight className="h-3 w-3" />
                <span>{route.to}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <StatusBadge status={booking.status} />
    </div>
  );
}

export const RecentBookingItem = React.memo(RecentBookingItemBase);