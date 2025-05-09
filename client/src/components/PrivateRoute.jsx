// client/src/components/PrivateRoute.jsx
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // While checking auth status, show a loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  // Once loaded, only show children if user exists
  return user ? children : <Navigate to="/signin" replace />;
}
