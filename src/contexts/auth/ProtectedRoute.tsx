import {type ReactNode, useEffect} from "react";
import {useAuth} from "../../hooks/useAuth";
import {Navigate} from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({children, requiredRoles = []}: ProtectedRouteProps) => {
  const {isAuthenticated, user, isLoading, login} = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      login();
    }
  }, [isLoading, isAuthenticated, login]);

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  if (requiredRoles.length > 0) {
    const userRoles = user?.realm_access?.roles || [];
    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace/>;
    }
  }

  return <>{children}</>;
};