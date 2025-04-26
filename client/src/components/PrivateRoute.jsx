// client/src/components/PrivateRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // While we’re checking the cookie/profile, don’t redirect
  if (loading) {
    return null; // or render a spinner here
  }

  // Once loaded, only show children if user exists
  return user ? children : <Navigate to="/signin" replace />;
}
