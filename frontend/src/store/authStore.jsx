import { createContext, useReducer, useContext } from 'react';

const AuthContext = createContext(null);

const initialState = (() => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (user && token) return { user, token, isAuthenticated: true };
  } catch {
    // ignore
  }
  return { user: null, token: null, isAuthenticated: false };
})();

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN': {
      const { token, ...user } = action.payload;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token, isAuthenticated: true };
    }
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { user: null, token: null, isAuthenticated: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
