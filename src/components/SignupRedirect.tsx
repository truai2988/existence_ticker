import { Navigate, useLocation } from 'react-router-dom';

export const SignupRedirect = () => {
  const location = useLocation();
  return <Navigate to={`/app${location.search}`} replace />;
};
