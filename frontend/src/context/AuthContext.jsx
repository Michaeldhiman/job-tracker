import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi } from '../api/authApi.js';
import { setLogoutHandler } from './authState.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Provide logout handler to axios interceptor
  useEffect(() => {
    setLogoutHandler(logout);
    return () => setLogoutHandler(null);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginApi(credentials);
      const { token: newToken, user: userData } = response;

      // Save to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Update state
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: { 
            message: error.message || 'Network error. Please check if the backend server is running.' 
          },
        };
      }
      
      return {
        success: false,
        error: error.response?.data || { message: 'Login failed' },
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerApi(userData);
      const { token: newToken, user: newUser } = response;

      // Save to localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Update state
      setToken(newToken);
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: { 
            message: error.message || 'Network error. Please check if the backend server is running.' 
          },
        };
      }
      
      return {
        success: false,
        error: error.response?.data || { message: 'Registration failed' },
      };
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Reset state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

