import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ShieldAlert, Home, ArrowLeft, LogIn } from "lucide-react";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userDashboard, setUserDashboard] = useState('/employee/dashboard');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);

    // Get user's dashboard
    const primaryDashboard = localStorage.getItem("primary_dashboard");
    if (primaryDashboard) {
      setUserDashboard(primaryDashboard);
    }

    // Log unauthorized access attempt
    console.warn(
      "Unauthorized access attempt:",
      location.pathname,
      "User authenticated:",
      !!token
    );
  }, [location.pathname]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    if (isAuthenticated) {
      navigate(userDashboard);
    } else {
      navigate("/login");
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-16 w-16 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-md">
              <span className="text-white text-2xl font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-bold text-gray-800 mb-4 tracking-tight">
          403
        </h1>

        {/* Error Message */}
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">
          Access Denied
        </h2>

        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
          {isAuthenticated ? (
            <>
              You don't have permission to access this page. 
              This area is restricted to authorized users with specific roles.
            </>
          ) : (
            <>
              You need to be logged in to access this page. 
              Please log in with an authorized account.
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthenticated ? (
            <>
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium shadow-sm min-w-[160px] justify-center"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2} />
                Go Back
              </button>

              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl min-w-[160px] justify-center"
              >
                <Home className="h-5 w-5" strokeWidth={2} />
                Go to Dashboard
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 font-medium shadow-sm min-w-[160px] justify-center"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2} />
                Go Back
              </button>

              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium shadow-lg hover:shadow-xl min-w-[160px] justify-center"
              >
                <LogIn className="h-5 w-5" strokeWidth={2} />
                Login
              </button>
            </>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {isAuthenticated ? (
              <>
                If you believe you should have access to this page, 
                please contact your administrator.
              </>
            ) : (
              <>
                Don't have an account? Contact your administrator for access.
              </>
            )}
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-red-200 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-orange-300 rounded-full opacity-20 blur-xl"></div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;