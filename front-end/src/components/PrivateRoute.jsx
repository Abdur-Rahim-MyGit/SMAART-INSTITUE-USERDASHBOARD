import { Navigate, Outlet } from 'react-router-dom';

/**
 * PrivateRoute — checks for an auth token in sessionStorage.
 * If missing, redirects to the landing/login page.
 * If present, renders the nested child routes via <Outlet />.
 */
const PrivateRoute = () => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
