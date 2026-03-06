const jwt = require('jsonwebtoken');
const User = require('../../models/User');

class AuthMiddleware {
  async protect(req, res, next) {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ success: false, message: 'Not authorized' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
      next();
    } catch {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
  }

  authorize(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Not authorized for this action' });
      }
      next();
    };
  }
}

module.exports = new AuthMiddleware();
