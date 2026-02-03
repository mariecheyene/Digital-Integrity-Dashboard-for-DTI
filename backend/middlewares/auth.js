// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access token required' 
    });
  }

  // In a real system, you'd verify JWT here
  // For now, we'll use a simple token validation
  try {
    // Simple token validation (replace with JWT verification)
    req.user = { 
      id: token, 
      role: req.headers['user-role'] || 'staff' 
    };
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
};

// Role-based authorization
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false,
      message: 'Admin access required' 
    });
  }
  next();
};

// Authorize specific roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  authorizeRoles
};