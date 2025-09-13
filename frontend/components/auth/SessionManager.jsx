'use client';

import { useAuth } from '../../contexts/AuthContext';

export default function SessionManager() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  // Hide session display widget to prevent screen blocking
  return null;
}
