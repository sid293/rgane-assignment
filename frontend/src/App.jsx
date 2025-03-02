import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Login from './components/auth/Login';
import Register from './components/auth/Register';

import CandidateProfile from './components/candidate/CandidateProfile';

import CompanyDashboard from './components/company/CompanyDashboard';
import CompanyProfile from './components/company/CompanyProfile';
import CandidateDetails from './components/company/CandidateDetails';
import AuthCallback from './components/AuthCallback';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userDataParam = urlParams.get('userData');
    const errorParam = urlParams.get('error');

    if (token && userDataParam) {
      try {
        const parsedUserData = JSON.parse(userDataParam);
        
        localStorage.setItem('token', token);
        localStorage.setItem('userType', 'candidate');
        localStorage.setItem('userData', userDataParam);
        
        setIsAuthenticated(true);
        setUserType('candidate');
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    } else if (errorParam) {
      console.error('Authentication error:', errorParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const storedToken = localStorage.getItem('token');
    const storedUserType = localStorage.getItem('userType');
    
    if (storedToken) {
      setIsAuthenticated(true);
      setUserType(storedUserType);
    }
  }, []);

  const ProtectedRoute = ({ children, allowedUserType }) => {
    console.log("protected: ",isAuthenticated)
    if (!isAuthenticated) {
      console.log("protection not authenticated /")
      return <Navigate to="/" />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/candidate/profile" 
            element={
              <ProtectedRoute allowedUserType="candidate">
                <CandidateProfile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/company/dashboard" 
            element={
              <ProtectedRoute allowedUserType="company">
                <CompanyDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/company/candidates/:id" 
            element={
              <ProtectedRoute allowedUserType="company">
                <CandidateDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/company/profile" 
            element={
              <ProtectedRoute allowedUserType="company">
                <CompanyProfile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                {userType === 'candidate' ? 
                  <Navigate to="/candidate/profile" /> : 
                  <Navigate to="/company/dashboard" />}
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
