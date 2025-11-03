import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import { AuthToken } from './types';

const API_URL = 'http://127.0.0.1:8000/api';

// --- AUTHENTICATION CONTEXT ---
interface IAuthContext {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<string | null>;
  register: (user: string, email: string, pass: string) => Promise<string | null>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;  //<--- Logica de autenticacion
}

// Crea el context
const AuthContext = createContext<IAuthContext | null>(null);

// Create the provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tokens, setTokens] = useState<AuthToken | null>(() => {
    // Check local storage for existing tokens on initial load
    const storedTokens = localStorage.getItem('authTokens');
    return storedTokens ? JSON.parse(storedTokens) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // User is authenticated if tokens exist
  const isAuthenticated = !!tokens;

  // --- Login Function ---
  const login = async (username: string, pass: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return errorData.detail || 'Failed to log in';
      }
      const data: AuthToken = await response.json();
      setTokens(data);
      localStorage.setItem('authTokens', JSON.stringify(data));
      return null; // No error
    } catch (err) {
      return 'A network error occurred. Please try again.';
    }
  };

  // --- Register Function ---
  const register = async (
    username: string,
    email: string,
    pass: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(`${API_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: pass }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.username) return `Username: ${errorData.username[0]}`;
        if (errorData.email) return `Email: ${errorData.email[0]}`;
        return 'Registration failed.';
      }
      // Automatically log in after successful registration
      return login(username, pass);
    } catch (err) {
      return 'A network error occurred. Please try again.';
    }
  };

  // --- Logout Function ---
  const logout = () => {
    setTokens(null);
    localStorage.removeItem('authTokens');
  };

  // --- Authenticated Fetch Function ---
  // This is our 'fetch' replacement that adds the auth token
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const storedTokens = localStorage.getItem('authTokens');
    if (!storedTokens) {
      logout();
      throw new Error("User not authenticated");
    }
    
    const { access } = JSON.parse(storedTokens) as AuthToken;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access}`,
    };
    
    // Merge default headers with any custom headers
    options.headers = { ...defaultHeaders, ...options.headers };

    const response = await fetch(`${API_URL}${url}`, options);
    
    // If the token is expired/invalid, log the user out
    if (response.status === 401) {
      logout();
      throw new Error("Session expired. Please log in again.");
    }
    
    return response;
  }, []); // 'logout' is stable, so we can use an empty dep array

  // On initial load, set loading to false.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // The value to pass to consumers
  const contextValue = {
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    authFetch,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom hook to easily access auth state ---
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

