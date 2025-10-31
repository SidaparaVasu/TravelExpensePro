import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTravelStore } from '@/src/store/travelStore';
import { Layout } from '@/components/Layout';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Filter,
  Search,
  Clock,
  CheckCircle,
  DollarSign,
  XCircle,
  ChevronDown,
  ClipboardList,
  SquarePen,
} from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { Plus, SendHorizontal, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { travelAPI } from "@/src/api/travel";

export default function TravelApplicationList() {
  const { applications, stats, isLoading, loadApplications, loadStats, submitApplication, deleteApplication } = useTravelStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [application, setApplications] = useState<TravelApplication | null>(null);
  const { id } = useParams<{ id: string }>();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");


  useEffect(() => {
    loadApplications(statusFilter);
    loadStats();
  }, [statusFilter]);

  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: (id: number) => travelAPI.submitApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] }); // refresh list
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => travelAPI.deleteApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] }); // refresh list
    },
  });

  const handleSubmitApplication = async (id: number) => {
    try {
      await submitApplication(id);
      toast({ title: 'Success', description: 'Application submitted successfully' });
    } catch (error: any) {
      console.log("ERROR: ", error);
      toast({ title: 'Error', description: error.validation_error || "Failed to submit application", variant: 'destructive' });
    }
  };

  const handleDeleteApplication = async (id: number) => {
    if (confirm('Are you sure you want to delete this application?')) {
      try {
        // await deleteMutation.mutate(id);
        await deleteApplication(id);
        toast({ title: 'Success', description: 'Application deleted successfully' });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete application', variant: 'destructive' });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'default',
      pending_manager: 'pending',
      pending_travel_desk: 'pending',
      approved_manager: 'success',
      rejected_manager: 'destructive',
      rejected_chro: 'destructive',
      rejected_ceo: 'destructive',
      completed: 'success',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    if (startDate === endDate) {
      return formatDate(start);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  if (isLoading) {
    return <Layout><div className="p-4">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-semibold">My Travel Applications</h1>
          <Button onClick={() => navigate('/travel/make-travel-application')}>
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-blue-50 flex items-center justify-center">
                    <ClipboardList className="h-7 w-7 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.total_applications}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Applications
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-gray-100 flex items-center justify-center">
                    <SquarePen className="h-7 w-7 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.draft}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Draft(s)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-orange-50 flex items-center justify-center">
                    <Clock className="h-7 w-7 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.pending}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Remaining submissions
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-[70px] h-[70px] rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle className="h-7 w-7 text-green-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stats.pending}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Approved applications
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )} 

        {/* Filters */}
        <Card className="bg-white shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by employee name or request ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[170px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Purpose</TableHead>
                  {/* <TableHead>Trips</TableHead> */}
                  <TableHead className="text-center">Dates</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      {statusFilter === "all" && "No travel applications found. Create your first travel application."}
                      {statusFilter === "pending" && "No pending applications found."}
                      {statusFilter === "approved" && "No approved applications found."}
                      {statusFilter === "rejected" && "No rejected applications found."}
                      {statusFilter === "draft" && "No draft applications found."}
                      {statusFilter === "completed" && "No completed applications found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.travel_request_id}</TableCell>
                      <TableCell>{app.purpose}...</TableCell>
                      {/* <TableCell>{app.trip_details.length} trip(s)</TableCell> */}
                      <TableCell>{formatDateRange(app.trip_details[0].departure_date, app.trip_details[0].return_date)}</TableCell>
                      <TableCell>₹{parseFloat(app.estimated_total_cost).toLocaleString()}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-center gap-2">
                          {app.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              // onClick={() => navigate(`/employee/travel/${app.id}`)}
                              onClick={() => handleSubmitApplication(app.id)}
                            >
                              <SendHorizontal />
                            </Button>
                          )}
                          {app.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDeleteApplication(app.id)}
                            >
                              <Trash2 className="w-2 h-2" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="hover:bg-dark-200 hover:text-dark-foreground"
                            onClick={() => navigate(`/travel/travel-application/${app.id}/`)}
                          >
                            <Eye className="w-2 h-2" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}