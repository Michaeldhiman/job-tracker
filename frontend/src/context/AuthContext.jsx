import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi, register as registerApi } from '../api/authApi.js';
import { setLogoutHandler } from './authState.js';
import { useTheme } from './ThemeContext.jsx';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setTheme } = useTheme();

  // Sync theme when user state changes
  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    }
  }, [user, setTheme]);

  // Initialize from URL parameters (for OAuth callback redirect) or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlUser = params.get('user');

    if (urlToken && urlUser) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(urlUser));
        
        // Check remember me preference from Google login callback
        const rememberMe = sessionStorage.getItem('remember_me') !== 'false';
        sessionStorage.removeItem('remember_me');

        if (rememberMe) {
          localStorage.setItem('token', urlToken);
          localStorage.setItem('user', JSON.stringify(parsedUser));
        } else {
          sessionStorage.setItem('token', urlToken);
          sessionStorage.setItem('user', JSON.stringify(parsedUser));
        }
        
        setToken(urlToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        
        // Clean URL query parameters to keep address bar clean
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing Google OAuth user data:', error);
      }
    } else {
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
        }
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
      const { rememberMe, ...loginData } = credentials;
      const response = await loginApi(loginData);
      const { token: newToken, user: userData } = response;

      if (rememberMe) {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
      }

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

      // Registration defaults to persistent login (rememberMe = true)
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
    // Clear both localStorage and sessionStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');

    // Reset state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    if (localStorage.getItem('token')) {
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('user', JSON.stringify(userData));
    }
    setUser(userData);
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
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

