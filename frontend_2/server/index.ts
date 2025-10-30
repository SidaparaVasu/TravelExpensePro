import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  getStats,
  getApprovalStats,
  getTravelRequests,
  getTravelRequestApprovals,
  getExpenseReports,
  getMonthlyExpenses,
  getTravelRequest,
  updateTravelRequestStatus,
  getExpenseReport,
  updateExpenseReportStatus,
} from "./routes/travel";
import { loginHandler } from "./routes/auth";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.post("/api/login", loginHandler);

  app.get("/api/stats", getStats);
  app.get("/api/approval-stats", getApprovalStats);
  app.get("/api/travel-requests", getTravelRequests);
  app.get("/api/travel-request-approvals", getTravelRequestApprovals);
  app.get("/api/travel-requests/:id", getTravelRequest);
  app.put("/api/travel-requests/:id/status", updateTravelRequestStatus);
  app.get("/api/expense-reports", getExpenseReports);
  app.get("/api/expense-reports/:id", getExpenseReport);
  app.put("/api/expense-reports/:id/status", updateExpenseReportStatus);
  app.get("/api/monthly-expenses", getMonthlyExpenses);

  return app;
}
