import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CompanyDashboard = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skills: '',
    location: '',
    role: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidates = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/candidates`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setCandidates(response.data);
        setFilteredCandidates(response.data);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        setError('Failed to load candidates. Please try again.');
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

    fetchCandidates();
  }, [navigate]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const applyFilters = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      // Build query parameters
      const params = {};
      if (filters.skills.trim()) params.skills = filters.skills.trim();
      if (filters.location.trim()) params.location = filters.location.trim();
      if (filters.role.trim()) params.role = filters.role.trim();

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/candidates`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params
        }
      );

      setFilteredCandidates(response.data);
    } catch (error) {
      console.error('Error applying filters:', error);
      setError('Failed to filter candidates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      skills: '',
      location: '',
      role: ''
    });
    setFilteredCandidates(candidates);
  };

  const viewCandidateDetails = (candidateId) => {
    navigate(`/company/candidates/${candidateId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userType');
    navigate('/');
  };

  if (isLoading && candidates.length === 0) {
    return <div className="loading">Loading candidates...</div>;
  }

  return (
    <div className="company-dashboard-container">
      <div className="dashboard-header">
        <h2>Candidate Search</h2>
        <div className="header-actions">
          <button 
            className="profile-button" 
            onClick={() => navigate('/company/profile')}
          >
            Company Profile
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

      <div className="filter-section">
        <h3>Filter Candidates</h3>
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="skills">Skills</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={filters.skills}
              onChange={handleFilterChange}
              placeholder="e.g. React, JavaScript, Python"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              placeholder="e.g. New York, Remote"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="role">Preferred Role</label>
            <input
              type="text"
              id="role"
              name="role"
              value={filters.role}
              onChange={handleFilterChange}
              placeholder="e.g. Frontend Developer, Data Scientist"
            />
          </div>

          <div className="filter-actions">
            <button 
              className="apply-filter-button" 
              onClick={applyFilters}
              disabled={isLoading}
            >
              {isLoading ? 'Applying...' : 'Apply Filters'}
            </button>
            <button 
              className="reset-filter-button" 
              onClick={resetFilters}
              disabled={isLoading}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="candidates-list">
        <h3>Available Candidates ({filteredCandidates.length})</h3>
        
        {filteredCandidates.length === 0 ? (
          <div className="no-candidates">No candidates match your search criteria.</div>
        ) : (
          <div className="candidates-grid">
            {filteredCandidates.map(candidate => (
              <div key={candidate._id} className="candidate-card" onClick={() => viewCandidateDetails(candidate._id)}>
                <div className="candidate-header">
                  {candidate.profilePicture ? (
                    <img 
                      src={candidate.profilePicture} 
                      alt={`${candidate.firstName} ${candidate.lastName}`} 
                      className="candidate-picture"
                    />
                  ) : (
                    <div className="candidate-picture-placeholder">
                      {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                    </div>
                  )}
                  <h4>{candidate.firstName} {candidate.lastName}</h4>
                </div>
                
                <div className="candidate-location">
                  {candidate.location || 'Location not specified'}
                </div>
                
                <div className="candidate-skills">
                  {candidate.skills && candidate.skills.length > 0 ? (
                    candidate.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))
                  ) : (
                    <span className="no-skills">No skills listed</span>
                  )}
                  {candidate.skills && candidate.skills.length > 3 && (
                    <span className="more-skills">+{candidate.skills.length - 3} more</span>
                  )}
                </div>
                
                <div className="candidate-roles">
                  {candidate.preferredRoles && candidate.preferredRoles.length > 0 ? (
                    candidate.preferredRoles.slice(0, 2).map((role, index) => (
                      <span key={index} className="role-tag">{role}</span>
                    ))
                  ) : (
                    <span className="no-roles">No preferred roles</span>
                  )}
                  {candidate.preferredRoles && candidate.preferredRoles.length > 2 && (
                    <span className="more-roles">+{candidate.preferredRoles.length - 2} more</span>
                  )}
                </div>
                
                <button className="view-profile-button">View Profile</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDashboard;