import {ReactKeycloakProvider} from "@react-keycloak/web";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'react-hot-toast';
import { keycloak } from "./services/keycloak";
import { AuthProvider } from "./contexts/auth/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import {ProtectedRoute} from "./contexts/auth/ProtectedRoute.tsx";
import {NotificationTest} from "./components/NotificationTest.tsx";

const queryClient = new QueryClient();

const keycloakProviderInitConfig = {
  onLoad: 'check-sso',
  silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
}

function App() {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakProviderInitConfig}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<div>Home Page</div>} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <div>Dashboard Page</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
                <Route path="/notification-test" element={<NotificationTest/>} />
              </Routes>
              <Toaster />
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ReactKeycloakProvider>
  );
}

export default App;