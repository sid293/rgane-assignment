import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userDataStr = params.get('userData');
    const error = params.get('error');

    if (error) {
      console.error('Authentication error:', error);
      navigate('/login', { state: { error } });
      return;
    }

    if (token && userDataStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataStr));
        
        localStorage.setItem('token', token);
        localStorage.setItem('userData', userDataStr);
        
        navigate('/candidate/profile');
      } catch (error) {
        console.error('Error parsing user data:', error);
        console.log("navigating to login")
        // navigate('/login', { state: { error: 'Invalid user data' } });
      }
    } else {
      console.error('Missing authentication data login');
    //   navigate('/login', { state: { error: 'Missing authentication data' } });
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
        <p>Please wait while we redirect you.</p>
      </div>
    </div>
  );
};

export default AuthCallback;