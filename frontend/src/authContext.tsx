// frontend/src/authContext.ts
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the type for the AuthContext
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void; // Function to update authentication
}

// Create the context with the correct type, and a default value
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // The value provided by the context, with the correct type
  const value: AuthContextType = {
    isAuthenticated,
    setIsAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider"); // More descriptive error
  }
  return context;
};
