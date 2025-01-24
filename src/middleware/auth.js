import jwt from "jsonwebtoken"

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];  // Extract token from the Authorization header
  
    if (!token) {
      return res.status(401).json({ message: 'Token is required' });
    }
  
    // Verify the token using the same secret key
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
      
      // Attach the user data to the request object for further use
      req.user = decoded.user;  // decoded.user contains the { id, role } from the payload
      next();
    });
};