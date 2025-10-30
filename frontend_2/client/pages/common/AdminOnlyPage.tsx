import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminOnlyPage() {
  const navigate = useNavigate();
  const primaryDashboard = localStorage.getItem("primary_dashboard") || "/dashboard";

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-5rem)] text-center px-4">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Access Denied</h1>
      <p className="text-lg text-gray-700 mb-6">
        Only admin users can access this page.
      </p>
      <button
        onClick={() => navigate(primaryDashboard)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
}
