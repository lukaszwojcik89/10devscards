import React, { useState, useEffect } from "react";
import { DashboardContainer } from "./dashboard/DashboardContainer";

/**
 * Smart component that shows either dashboard or landing page based on auth status
 */
export const AppContainer: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication status on client side
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);

    // Hide landing page if authenticated
    const landingPage = document.getElementById("landing-page");
    if (landingPage) {
      landingPage.style.display = token ? "none" : "block";
    }
  }, []);

  // While checking auth status, don't render anything
  if (isAuthenticated === null) {
    return null;
  }

  // If authenticated, show dashboard
  if (isAuthenticated) {
    return <DashboardContainer />;
  }

  // If not authenticated, landing page is already visible in HTML
  return null;
};
