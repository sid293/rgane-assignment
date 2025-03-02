import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLinkedInLogin = async () => {
    console.log("handling linkedin login");
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/linkedin`);
      console.log("LinkedIn auth URL:", response.data.url);
      // Use window.location.href to redirect to LinkedIn's auth page
      window.location.href = response.data.url;
    } catch (error) {
      console.error('LinkedIn login error:', error);
      setError('Failed to initiate LinkedIn login');
    }
  };

  const handleCompanyLogin = async (e) => {
    console.log("handeling company login")
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/companies/login`, {
        email,
        password
      });
      console.log("got response: ",response);

      // Store token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userType', 'company');
      localStorage.setItem('userData', JSON.stringify(response.data.company));

      // Redirect to company dashboard
      navigate('/company/dashboard');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Welcome</h2>
      
      <div className="login-options">
        <div className="candidate-login">
          <h3>Candidates</h3>
          <p>Looking for job opportunities?</p>
          <button 
            className="linkedin-button" 
            onClick={handleLinkedInLogin}
            disabled={isLoading}
          >
            Login with LinkedIn
          </button>
        </div>

        <div className="company-login">
          <h3>Companies</h3>
          <p>Looking to hire talent?</p>
          <form onSubmit={handleCompanyLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p>
            Don't have an account?{' '}
            <a href="/register">Register as a company</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;