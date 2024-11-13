const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const Auth = (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log('Token:', token);
    
    if (!token) {
        return res.status(401).json({ message: 'Authentication failed: No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY);
        req.user = { id: decoded.id };
        console.log('Decoded User ID:', req.user.id);
        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ message: 'Authentication failed: Invalid token.' });
    }
};


module.exports = Auth;