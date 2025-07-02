import {ReactKeycloakProvider} from "@react-keycloak/web";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { keycloak } from "./services/keycloak";
import { AuthProvider } from "./contexts/auth/AuthContext";
import {ProtectedRoute} from "./contexts/auth/ProtectedRoute.tsx";

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
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ReactKeycloakProvider>
  );
}

export default App;