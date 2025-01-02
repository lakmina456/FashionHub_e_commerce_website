const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        await auth(req, res, async () => {
            const user = await User.findById(req.user.userId);
            if (user.role !== 'admin') {
                return res.status(403).json({ message: 'Access denied' });
            }
            next();
        });
    } catch (err) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

module.exports = { auth, adminAuth }; 