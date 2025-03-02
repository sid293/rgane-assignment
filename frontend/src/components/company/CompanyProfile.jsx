import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CompanyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/companies/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching company profile:', error);
        setError('Failed to load profile');
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          localStorage.removeItem('userType');
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (isLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="company-profile-container">
      <div className="profile-header">
        <h2>Company Profile</h2>
        <div className="header-actions">
          <button 
            className="dashboard-button" 
            onClick={() => navigate('/company/dashboard')}
          >
            Back to Dashboard
          </button>
          <button 
            className="logout-button" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {profile && (
        <div className="profile-content">
          <div className="profile-section">
            <h3>Company Details</h3>
            <div className="profile-field">
              <label>Company Name:</label>
              <span>{profile.name}</span>
            </div>
            <div className="profile-field">
              <label>Email:</label>
              <span>{profile.email}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfile;