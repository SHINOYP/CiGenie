import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {

  const user = localStorage.getItem("loggedInUser");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}