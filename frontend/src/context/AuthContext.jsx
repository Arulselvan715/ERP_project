import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const checkRole = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkRole,
    isAdmin: user?.role === 'admin',
    isSales: user?.role === 'sales_user' || user?.role === 'admin' || user?.role === 'business_owner',
    isPurchase: user?.role === 'purchase_user' || user?.role === 'admin' || user?.role === 'business_owner',
    isManufacturing: user?.role === 'manufacturing_user' || user?.role === 'admin' || user?.role === 'business_owner',
    isInventory: user?.role === 'inventory_manager' || user?.role === 'admin' || user?.role === 'business_owner',
    isOwner: user?.role === 'business_owner',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
