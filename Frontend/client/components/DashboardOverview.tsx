import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { approvalAPI } from "@/src/api/approval";
import {
  StatCard,
  TravelRequestItem,
  ExpenseReportItem,
  ExpenseTrendChart,
} from "@/components/dashboard";
import {
  StatCardPlane,
  StatCardFileText,
  StatCardWaiting,
  StatCardExpense,
} from "@/assets/icons";
import { CheckCheckIcon, IndianRupeeIcon } from "lucide-react";


interface ApprovalStats {
  pendingApproval: number;
  approvedToday: number;
  totalBudget: string;
  rejected: number;
}

interface RecentActivities {
  action: string,
  approval_level: string,
  employee_name: string,
  travel_request_id: string,
  location: object,
}

export function DashboardOverview() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [activity, setAcitivity] = useState<RecentActivities | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const dashboardData = await approvalAPI.getDashboard();
      setStats(dashboardData.data.statistics);
      setAcitivity(dashboardData.data.recent_activity)
      console.log(dashboardData.data);
    } catch (err) {
      console.error("Failed to load approval statistics!", err);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  const values = [
    2750, 1800, 3800, 1120, 3760, 2300, 2130, 3446, 3910, 780, 1873, 2836,
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[26px] font-bold text-foreground">
          Dashboard Overview
        </h1>
        <p className="mt-2 text-lg text-foreground">
          Welcome back! Here's what's happening with your travel &
          expenses.
        </p>
      </div>

      {stats && (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Trips"
          value="24"
          icon={
            <StatCardPlane className="h-9 w-9 text-[#0B98D3] [&_*]:fill-current" />
          }
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Pending Expenses"
          value="₹15,150"
          icon={<StatCardFileText className="h-9 w-9" />}
          bgColor="bg-red-50"
        />
        <StatCard
          title="Awaiting Approval"
          value={stats.pending_approvals || 0}
          icon={<StatCardWaiting className="h-9 w-9" />}
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Total Approved"
          value={stats.total_approvals_done}
          icon={<CheckCheckIcon className="h-9 w-9 text-green-500" />}
          bgColor="bg-green-50"
        />
        {/* <StatCard
          title="Monthly Budget"
          value="₹45,000"
          icon={<IndianRupeeIcon className="h-9 w-9 text-green-500" />}
          bgColor="bg-green-50"
        /> */}
      </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[10px] bg-white p-6 shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Recent Travel Requests
            </h2>
            <button className="text-base font-bold text-primary underline" onClick={() => navigate(`/travel/travel-request-approval`)}>
              View All
            </button>
          </div>
          <div className="space-y-4">
            {
              Array.isArray(activity) && activity.map((request) => (
                <div>
                  <TravelRequestItem
                    name={request.employee_name}
                    avatar="https://api.builder.io/api/v1/image/assets/TEMP/4fa4c38ef3892012b166bc2fbb474ffbd49bda2e?width=100"
                    from={request.location.from_location__city_name}
                    to={request.location.to_location__city_name}
                    status={request.action}
                  />
                  <div className="h-px bg-foreground/10" />
                </div>
              ))
            }
            {activity?.length === 0 && (
                <center className="m-5">No recent application found.
                </center>
              )}
            {/* <TravelRequestItem
              name="Sarah Johnson"
              avatar="https://api.builder.io/api/v1/image/assets/TEMP/4fa4c38ef3892012b166bc2fbb474ffbd49bda2e?width=100"
              from="New York"
              to="London"
              status="pending"
            />
            <div className="h-px bg-foreground/10" />
            <TravelRequestItem
              name="Mike Chen"
              avatar="https://api.builder.io/api/v1/image/assets/TEMP/584eb215fe812bf81c2c9ffc953c457482b1f3de?width=100"
              from="San Francisco"
              to="Tokyo"
              status="approved"
            />
            <div className="h-px bg-foreground/10" />
            <TravelRequestItem
              name="Emma Davis"
              avatar="https://api.builder.io/api/v1/image/assets/TEMP/39373ec2416a0763f8d322ef0bcb73c6be64dd70?width=100"
              from="Chicago"
              to="Berlin"
              status="rejected"
            /> */}
          </div>
        </div>

        <div className="rounded-[10px] bg-white p-6 shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">
              Expense Reports
            </h2>
            <button className="text-base font-bold text-primary underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
            <ExpenseReportItem
              title="Q1 2025 Business Travel"
              submittedBy="Submitted by Alex Rivera"
              amount="₹3.245"
              status="pending"
            />
            <div className="h-px bg-foreground/10" />
            <ExpenseReportItem
              title="Client Meeting Expenses"
              submittedBy="Submitted by Lisa Park"
              amount="₹3.245"
              status="approved"
            />
            <div className="h-px bg-foreground/10" />
            <ExpenseReportItem
              title="Conference Attendance"
              submittedBy="Submitted by David Kim"
              amount="₹3.245"
              status="rejected"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[10px] bg-white p-6 shadow-[0_2px_2px_0_rgba(59,130,247,0.30)]">
        <h2 className="mb-8 text-xl font-bold text-foreground">
          Monthly Expense Trends
        </h2>
        <ExpenseTrendChart months={months} values={values} />
      </div>

      <div className="flex items-center justify-between py-4 text-base text-primary">
        <span>© 2025 Travel Expense Pro. All rights reserved.</span>
        <div className="flex gap-8">
          <a href="#" className="hover:underline">
            Privacy
          </a>
          <a href="#" className="hover:underline">
            Terms
          </a>
          <a href="#" className="hover:underline">
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
