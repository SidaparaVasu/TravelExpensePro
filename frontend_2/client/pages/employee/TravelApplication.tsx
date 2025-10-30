import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/http";
import { TravelRequestApproval } from "@shared/travel";
import { useToast } from "@/components/ui/use-toast";

// This constant data array MUST be defined OUTSIDE and BEFORE the component function.
const initialBookingSections = [
    {
    id: "flight",
    title: "Flight Booking",
    fields: [
      { name: "flightType", label: "Flight Type", placeholder: "Select Flight Type", type: "select", options: ["Economy", "Business", "First Class"] },
      { name: "fromPlace", label: "From Place", placeholder: "Select From Place", type: "select", options: ["New York", "London", "Delhi"] },
      { name: "toPlace", label: "To Place", placeholder: "Select To Place", type: "select", options: ["Paris", "Tokyo", "Dubai"] },
      { name: "airlineName", label: "Airline Name", placeholder: "Enter Airline Name", type: "text" },
      { name: "flightNo", label: "Flight No.", placeholder: "Enter Flight No", type: "text" },
    ],
  },
  {
    id: "train",
    title: "Train Booking",
    fields: [
      { name: "trainType", label: "Train Type", placeholder: "Enter Train Type", type: "text" },
      { name: "fromPlace", label: "From Place", placeholder: "Select From Place", type: "select", options: ["Delhi", "Mumbai", "Chennai"] },
      { name: "toPlace", label: "To Place", placeholder: "Select To Place", type: "select", options: ["Kolkata", "Bangalore", "Hyderabad"] },
      { name: "trainName", label: "Train Name", placeholder: "Enter Train Name", type: "text" },
      { name: "trainNo", label: "Train No.", placeholder: "Enter Train No", type: "text" },
    ],
  },
  {
    id: "accommodation",
    title: "Accommodation Booking",
    fields: [
      { name: "accommodationPreference", label: "Accommodation Preference", placeholder: "Select Preference", type: "select", options: ["Hotel", "Guest House", "Service Apartment"] },
      { name: "guestHouseName", label: "Guest House Name", placeholder: "Select Guest House Name", type: "select", options: ["Green Inn", "Blue Sky", "Sunrise Stay"] },
      { name: "checkInDate", label: "Date of Check-In", placeholder: "YYYY/MM/DD", type: "date" },
      { name: "numberOfDays", label: "Number of Days", placeholder: "Enter Number of Days", type: "number" },
      { name: "numberOfPersons", label: "Number of Persons", placeholder: "Enter Number of Persons", type: "number" },
      { name: "pickupRequired", label: "Pickup Facility Required", placeholder: "Select Pickup Facility", type: "select", options: ["Car", "Auto-Rickshaw", "Bus"] },
      { name: "pickupAddress", label: "Pickup Address", placeholder: "Enter Pickup Address", type: "text" },
    ],
  },
  {
    id: "car",
    title: "Car Booking",
    fields: [
      { name: "carType", label: "Car Type", placeholder: "Select Car Type", type: "select", options: ["Sedan", "SUV", "Hatchback"] },
      { name: "passengers", label: "No. of Passengers", placeholder: "Enter No. of Passengers", type: "number" },
      { name: "days", label: "No. of Days", placeholder: "Enter No. of Days", type: "number" },
      { name: "bookingDate", label: "Booking Date", placeholder: "YYYY/MM/DD", type: "date" },
      { name: "pickupAddress", label: "Pickup Address", placeholder: "Enter Pickup Address", type: "text" },
      { name: "pickupTime", label: "Pickup Time", type: "time" },
      { name: "dropAddress", label: "Drop Address", placeholder: "Enter Drop Address", type: "text" },
    ],
  },
  {
    id: "cab",
    title: "Cab Booking",
    fields: [
      { name: "carType", label: "Car Type", placeholder: "Select Car Type", type: "select", options: ["Sedan", "SUV", "Mini"] },
      { name: "passengers", label: "No. of Passengers", placeholder: "Enter No. of Passengers", type: "number" },
      { name: "days", label: "No. of Days", placeholder: "Enter No. of Days", type: "number" },
      { name: "bookingDate", label: "Booking Date", placeholder: "YYYY/MM/DD", type: "date" },
      { name: "pickupAddress", label: "Pickup Address", placeholder: "Enter Pickup Address", type: "text" },
      { name: "pickupTime", label: "Pickup Time", type: "time" },
      { name: "dropAddress", label: "Drop Address", placeholder: "Enter Drop Address", type: "text" },
    ],
  },
];

export default function TravelApplication() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<TravelRequestApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [bookingSections, setBookingSections] = useState(initialBookingSections);
  const [bookingData, setBookingData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (id) {
      setLoading(true);
      api.get(`/travel-requests/${id}`)
        .then((res) => setRequest(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  // client/pages/TravelApplication.tsx

  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    setIsUpdating(true);
    try {
      await api.put(`/travel-requests/${id}/status`, { status });
      
      // 1. Add a success toast
      toast({
        title: "Status Updated",
        description: `The request has been successfully ${status}.`,
      });

      // 2. Navigate back to the Travel Request page
      navigate("/travel-request");

    } catch (error) {
      console.error(`Failed to ${status} request:`, error);
      
      // 3. Add an error toast
      toast({
        title: "Update Failed",
        description: `There was a problem updating the request status. Please try again.`,
        variant: "destructive",
      });

    } finally {
      setIsUpdating(false);
    }
  };

  const handleBookingChange = (sectionId: string, fieldName: string, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || {}),
        [fieldName]: value,
      },
    }));
  };

  const handleUpdateSection = (sectionId: string, sectionTitle: string) => {
    const dataToUpdate = bookingData[sectionId] || {};
    console.log(`Updating ${sectionTitle} with data:`, dataToUpdate);
    toast({
      title: "Success!",
      description: `${sectionTitle} data has been "updated". (Check console for data).`,
    });
  };

  const handleRemoveSection = (sectionId: string, sectionTitle: string) => {
    setBookingSections(prev => prev.filter(section => section.id !== sectionId));
    toast({
      title: "Section Removed",
      description: `The ${sectionTitle} section has been removed.`,
      variant: "destructive",
    });
  };

  if (loading) {
    return <Layout><div className="p-4">Loading travel request details...</div></Layout>;
  }

  if (!request || !request.employee) {
    return <Layout><div className="p-4">Travel request not found or data is invalid.</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Travel Application Details
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Viewing request ID: {request.id} for {request.employee.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Employee Name</Label>
              <Input value={request.employee.name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={request.employee.department} disabled />
            </div>
             <div className="space-y-2">
              <Label>Purpose of Travel</Label>
              <Input value={request.destination.purpose} disabled />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={request.destination.location} disabled />
            </div>
            <div className="space-y-2">
              <Label>Travel Dates</Label>
              <Input value={`${request.travelDates.startDate} to ${request.travelDates.endDate}`} disabled />
            </div>
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input value={request.budget} disabled />
            </div>
          </CardContent>
        </Card>

        {bookingSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={`${section.id}-${field.name}`}>{field.label}</Label>
                  {field.type === 'select' ? (
                    <Select
                      value={bookingData[section.id]?.[field.name] || ""}
                      onValueChange={(value) => handleBookingChange(section.id, field.name, value)}
                    >
                      <SelectTrigger id={`${section.id}-${field.name}`}>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={`${section.id}-${field.name}`}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={bookingData[section.id]?.[field.name] || ""}
                      onChange={(e) => handleBookingChange(section.id, field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-start gap-3 border-t pt-6 mt-6">
                <Button onClick={() => handleUpdateSection(section.id, section.title)}>
                  Update
                </Button>
                <Button variant="destructive" onClick={() => handleRemoveSection(section.id, section.title)}>
                  Remove
                </Button>
            </CardFooter>
          </Card>
        ))}

        <div className="flex gap-4 pt-6 border-t">
            <Button
              onClick={() => handleUpdateStatus("approved")}
              disabled={isUpdating || request.status !== 'pending'}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "Processing..." : "Approve"}
            </Button>
            <Button
              onClick={() => handleUpdateStatus("rejected")}
              disabled={isUpdating || request.status !== 'pending'}
              variant="destructive"
            >
              {isUpdating ? "Processing..." : "Reject"}
            </Button>
        </div>
      </div>
    </Layout>
  );
}