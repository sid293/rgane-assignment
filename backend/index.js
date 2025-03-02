require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const Candidate = require('./models/Candidate');
const Company = require('./models/Company');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin-clone')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

app.get('/api/auth/linkedin', (req, res) => {
  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&scope=openid%20profile%20email`;
  res.json({ url: linkedinAuthUrl });
});

app.get('/api/auth/linkedin/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const userData = userInfoResponse.data;

    let candidate = await Candidate.findOne({ linkedinId: userData.sub });
    
    if (!candidate) {
      candidate = new Candidate({
        linkedinId: userData.sub,
        email: userData.email,
        firstName: userData.given_name,
        lastName: userData.family_name,
        profilePicture: userData.picture
      });
      await candidate.save();
    }

    const token = jwt.sign(
      { id: candidate._id, type: 'candidate' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&userData=${encodeURIComponent(JSON.stringify(candidate))}`);
  } catch (error) {
    console.error('LinkedIn OAuth Error:', error.response?.data || error.message || error);
    res.redirect(`${process.env.FRONTEND_URL}?error=Authentication failed`);
  }
});

app.get('/api/candidates/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'candidate') {
      return res.status(403).json({ message: 'Access denied. Not a candidate account.' });
    }
    
    const candidate = await Candidate.findById(req.user.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/candidates/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'candidate') {
      return res.status(403).json({ message: 'Access denied. Not a candidate account.' });
    }
    
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      req.user.id,
      { 
        ...req.body,
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/companies/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company with this email already exists' });
    }
    
    const company = new Company({
      name,
      email,
      password
    });
    
    await company.save();
    
    const token = jwt.sign(
      { id: company._id, type: 'company' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      token,
      company: {
        id: company._id,
        name: company.name,
        email: company.email
      }
    });
  } catch (error) {
    console.error('Error registering company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/companies/login', async (req, res) => {
  console.log("companies login hit")
  try {
    const { email, password } = req.body;
    
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { id: company._id, type: 'company' },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1d' }
    );
    
    console.log("returnign company detials");
    res.json({
      token,
      company: {
        id: company._id,
        name: company.name,
        email: company.email
      }
    });
  } catch (error) {
    console.error('Error logging in company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/companies/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'company') {
      return res.status(403).json({ message: 'Access denied. Not a company account.' });
    }
    
    const company = await Company.findById(req.user.id).select('-password');
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/companies/profile', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'company') {
      return res.status(403).json({ message: 'Access denied. Not a company account.' });
    }
    
    const updatedCompany = await Company.findByIdAndUpdate(
      req.user.id,
      { 
        ...req.body,
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/candidates', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'company') {
      return res.status(403).json({ message: 'Access denied. Only companies can view candidates.' });
    }
    
    const { skills, location, role } = req.query;
    let query = {};
    
    if (skills) {
      query.skills = { $in: skills.split(',') };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (role) {
      query.preferredRoles = { $in: role.split(',') };
    }
    
    const candidates = await Candidate.find(query).select('firstName lastName profilePicture skills location preferredRoles');
    
    res.json(candidates);
  } catch (error) {
    console.error('Error searching candidates:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/candidates/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'company') {
      return res.status(403).json({ message: 'Access denied. Only companies can view candidate details.' });
    }
    
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    
    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});