import {createContext, type ReactNode, useEffect, useState} from 'react';
import {useKeycloak} from '@react-keycloak/web';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => void;
  token: string | undefined;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({children}: { children: ReactNode }) => {
  const {keycloak, initialized} = useKeycloak();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialized) {
      setIsLoading(false);
    }
  }, [initialized]);

  const value = {
    isAuthenticated: !!keycloak.authenticated,
    user: keycloak.tokenParsed,
    login: () => keycloak.login(),
    logout: () => keycloak.logout(),
    token: keycloak.token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export {AuthContext};
