import { createContext } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  login: () => {},
  logout: () => {}
});

export default AuthContext; 