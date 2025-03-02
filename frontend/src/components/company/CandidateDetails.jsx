import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const CandidateDetails = () => {
  const [candidate, setCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCandidateDetails = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/candidates/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setCandidate(response.data);
      } catch (error) {
        console.error('Error fetching candidate details:', error);
        setError('Failed to load candidate details. Please try again.');
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

    fetchCandidateDetails();
  }, [id, navigate]);

  const handleBack = () => {
    navigate('/company/dashboard');
  };

  if (isLoading) {
    return <div className="loading">Loading candidate details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={handleBack} className="back-button">Back to Dashboard</button>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="not-found-container">
        <div className="not-found-message">Candidate not found</div>
        <button onClick={handleBack} className="back-button">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="candidate-details-container">
      <div className="details-header">
        <button onClick={handleBack} className="back-button">
          &larr; Back to Dashboard
        </button>
        <h2>Candidate Profile</h2>
      </div>

      <div className="candidate-profile">
        <div className="profile-header">
          {candidate.profilePicture ? (
            <img 
              src={candidate.profilePicture} 
              alt={`${candidate.firstName} ${candidate.lastName}`} 
              className="profile-picture"
            />
          ) : (
            <div className="profile-picture-placeholder">
              {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
            </div>
          )}
          <div className="profile-name">
            <h3>{candidate.firstName} {candidate.lastName}</h3>
            <p className="profile-email">{candidate.email}</p>
            {candidate.location && (
              <p className="profile-location">{candidate.location}</p>
            )}
          </div>
        </div>

        {candidate.bio && (
          <div className="profile-section">
            <h4>About</h4>
            <p>{candidate.bio}</p>
          </div>
        )}

        <div className="profile-section">
          <h4>Skills</h4>
          {candidate.skills && candidate.skills.length > 0 ? (
            <div className="skills-list">
              {candidate.skills.map((skill, index) => (
                <span key={index} className="skill-tag">{skill}</span>
              ))}
            </div>
          ) : (
            <p>No skills listed</p>
          )}
        </div>

        <div className="profile-section">
          <h4>Preferred Roles</h4>
          {candidate.preferredRoles && candidate.preferredRoles.length > 0 ? (
            <div className="roles-list">
              {candidate.preferredRoles.map((role, index) => (
                <span key={index} className="role-tag">{role}</span>
              ))}
            </div>
          ) : (
            <p>No preferred roles specified</p>
          )}
        </div>

        {candidate.experience && candidate.experience.length > 0 && (
          <div className="profile-section">
            <h4>Experience</h4>
            <div className="experience-list">
              {candidate.experience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <h5>{exp.title}</h5>
                  <p className="company-name">{exp.company}</p>
                  <p className="experience-location">{exp.location}</p>
                  <p className="experience-dates">
                    {new Date(exp.startDate).toLocaleDateString()} - 
                    {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                  </p>
                  {exp.description && <p className="experience-description">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {candidate.education && candidate.education.length > 0 && (
          <div className="profile-section">
            <h4>Education</h4>
            <div className="education-list">
              {candidate.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <h5>{edu.institution}</h5>
                  <p>{edu.degree} in {edu.field}</p>
                  <p className="education-dates">
                    {new Date(edu.startDate).toLocaleDateString()} - 
                    {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDetails;