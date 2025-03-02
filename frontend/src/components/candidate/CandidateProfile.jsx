import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CandidateProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    skills: [],
    location: '',
    preferredRoles: [],
    bio: '',
    newSkill: '',
    newRole: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('inside candidate profile')
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/candidates/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setProfile(response.data);
        setFormData({
          skills: response.data.skills || [],
          location: response.data.location || '',
          preferredRoles: response.data.preferredRoles || [],
          bio: response.data.bio || '',
          newSkill: '',
          newRole: ''
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again.');
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          navigate('/');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.newSkill.trim()],
        newSkill: ''
      });
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addRole = () => {
    if (formData.newRole.trim() && !formData.preferredRoles.includes(formData.newRole.trim())) {
      setFormData({
        ...formData,
        preferredRoles: [...formData.preferredRoles, formData.newRole.trim()],
        newRole: ''
      });
    }
  };

  const removeRole = (roleToRemove) => {
    setFormData({
      ...formData,
      preferredRoles: formData.preferredRoles.filter(role => role !== roleToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const updateData = {
        skills: formData.skills,
        location: formData.location,
        preferredRoles: formData.preferredRoles,
        bio: formData.bio
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/candidates/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        navigate('/');
      }
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="candidate-profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {profile && (
        <div className="profile-content">
          <div className="profile-basic-info">
            {profile.profilePicture && (
              <img 
                src={profile.profilePicture} 
                alt="Profile" 
                className="profile-picture" 
              />
            )}
            <div className="profile-name">
              <h3>{profile.firstName} {profile.lastName}</h3>
              <p>{profile.email}</p>
            </div>
          </div>

          {!isEditing ? (
            <div className="profile-details">
              <div className="profile-section">
                <h4>Location</h4>
                <p>{profile.location || 'Not specified'}</p>
              </div>

              <div className="profile-section">
                <h4>Bio</h4>
                <p>{profile.bio || 'No bio provided'}</p>
              </div>

              <div className="profile-section">
                <h4>Skills</h4>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="skills-list">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                ) : (
                  <p>No skills listed</p>
                )}
              </div>

              <div className="profile-section">
                <h4>Preferred Roles</h4>
                {profile.preferredRoles && profile.preferredRoles.length > 0 ? (
                  <div className="roles-list">
                    {profile.preferredRoles.map((role, index) => (
                      <span key={index} className="role-tag">{role}</span>
                    ))}
                  </div>
                ) : (
                  <p>No preferred roles specified</p>
                )}
              </div>

              <button 
                className="edit-profile-button" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="edit-profile-form">
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Your location"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows="4"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Skills</label>
                <div className="add-item-input">
                  <input
                    type="text"
                    name="newSkill"
                    value={formData.newSkill}
                    onChange={handleChange}
                    placeholder="Add a skill"
                  />
                  <button type="button" onClick={addSkill}>Add</button>
                </div>
                <div className="tags-container">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="tag">
                      {skill}
                      <button 
                        type="button" 
                        className="remove-tag" 
                        onClick={() => removeSkill(skill)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Preferred Roles</label>
                <div className="add-item-input">
                  <input
                    type="text"
                    name="newRole"
                    value={formData.newRole}
                    onChange={handleChange}
                    placeholder="Add a preferred role"
                  />
                  <button type="button" onClick={addRole}>Add</button>
                </div>
                <div className="tags-container">
                  {formData.preferredRoles.map((role, index) => (
                    <div key={index} className="tag">
                      {role}
                      <button 
                        type="button" 
                        className="remove-tag" 
                        onClick={() => removeRole(role)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;