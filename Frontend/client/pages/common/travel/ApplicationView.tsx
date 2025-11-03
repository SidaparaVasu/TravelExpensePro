import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { travelAPI, TravelApplication } from "@/lib/api/travel";
import { Layout } from "@/components/Layout";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SendHorizontal, Trash2 } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { FileText, Plane, MapPin, CalendarDays, IndianRupee } from "lucide-react";
import { useParams } from "react-router-dom";
import { useToast } from '@/components/ui/use-toast';
import { useTravelStore } from '@/src/store/travelStore';

const ApplicationView: React.FC = () => {
  const { id } = useParams();
  // const [application, setApplication] = useState<TravelApplication[]>([]);
  const [application, setApplication] = useState<TravelApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { submitApplication, deleteApplication } = useTravelStore();

  useEffect(() => {
    getApp();
  }, [id]);

    const getApp = async () => {
      try {
        if (!id) return;
        const app = await travelAPI.getApplication(Number(id));
        console.log("Fetched apps:", app); // debug log
        setApplication(app.data);
      } catch (err) {
        console.error(err);
        alert(err);
        alert(err.message);
        setError(err instanceof Error ? err.message : "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

  const handleSubmitApplication = (id: number) => {
    submitApplication(id);
    getApp();
  };

  const handleDeleteApplication = async (id: number) => {
    if (confirm('Are you sure you want to delete this application?')) {
      try {
        // await deleteMutation.mutate(id);
        await deleteApplication(id);
        toast({ title: 'Success', description: 'Application deleted successfully' });
        navigate('/travel-application-list');
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete application', variant: 'destructive' });
      }
    }
  };

  // if (loading) return <p>Loading applications...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex-col sm:flex-row sm:items-center sm:gap-2 w-full sm:w-auto">
              <CardTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {application?.travel_request_id}

                <Badge
                  variant="secondary"
                  className={`mt-1 sm:mt-0 text-xs uppercase ${application?.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : application?.status === "pending_manager"
                      ? "bg-orange-100 hover:bg-orange-100 text-orange-600"
                      : "bg-gray-100 text-gray-700"
                    }`}
                >
                  {application?.status.replace("_", " ")}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2 sm:mt-0">
                Created on {new Date(application?.created_at).toLocaleDateString()} by{" "}
                <span className="font-medium text-foreground">{application?.employee_name}</span>
              </p>
            </div>
            {/* DRAFT ACTIONS */}
            {application?.status === "draft" && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 sm:mt-0">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleSubmitApplication(application.id)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-primary text-white rounded hover:bg-gprimary/0.95 transition text-xs sm:text-sm"
                >
                  <SendHorizontal className="w-4 h-4" />
                  Submit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteApplication(application.id)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs sm:text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>

        {/* DETAILS SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
            <Detail label="Purpose" value={application?.purpose} />
            <span></span>
            <Detail label="Employee Grade" value={application?.employee_grade} />
            <Detail label="GL Code" value={application?.gl_code_name} />
            <Detail label="Internal Order" value={application?.internal_order} />
            <Detail label="Sanction Number" value={application?.sanction_number} />
            <Detail label="Estimated Cost" value={`₹${application?.estimated_total_cost}`} />
            <Detail label="Advance Amount" value={`₹${application?.advance_amount}`} />
          </CardContent>
        </Card>

        {/* TRIP DETAILS */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application?.trip_details
              ?.slice()
              .sort((a, b) => new Date(b.departure_date).getTime() - new Date(a.departure_date).getTime())
              .map((trip: any) => (
                <div
                  key={trip.id}
                  className="border border-border rounded-xl p-4 hover:shadow-sm transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div className="flex flex-col items-start gap-2">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-400" />
                        <span className="font-medium">
                          {trip.from_location_name} → {trip.to_location_name}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="mr-6"></span>
                        <span className="font-medium">Trip purpose: </span>
                        {trip.trip_purpose || "Not mentioned"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-primary mt-2 sm:mt-0">
                      <CalendarDays className="w-4 h-4 text-primary" />
                      {trip.departure_date} - {trip.return_date} ({trip.duration_days} days)
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* BOOKINGS */}
                  <div className="grid sm:grid-cols-2 gap-3">
                    {trip.bookings.map((b: any) => (
                      <div
                        key={b.id}
                        className="border border-dashed border-border rounded-lg p-3 bg-muted/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Plane className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{b.booking_type_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.sub_option_name || "N/A"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" />
                          {b.estimated_cost}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

    </Layout>
  )
};

const Detail = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-medium text-foreground">{value || "—"}</p>
  </div>
);

export default ApplicationView;
