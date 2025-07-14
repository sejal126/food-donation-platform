const jwt = require('jsonwebtoken');
//const User = require('../models/user'); // Adjust path if necessary

const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (Bearer TOKEN_STRING)
      token = req.headers.authorization.split(' ')[1];

      // Verify token using the secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token payload (we stored userId in the token)
      // Attach user object to the request (excluding the password)
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
         // Handle case where user associated with token no longer exists
         return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Optional middleware to restrict access to specific roles
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles is an array like ['admin', 'ngo']
        // req.user.role is set by the 'protect' middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
};


module.exports = { protect, restrictTo };