const jwt = require('jsonwebtoken');

const jwtAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    console.log('🔍 JWT Auth - Header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ JWT verified - userId:', decoded.userId);
    
    // Attach user info to request
    req.auth = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (err) {
    console.error('❌ JWT Auth error:', err.message);
    return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
  }
};

module.exports = jwtAuth;
