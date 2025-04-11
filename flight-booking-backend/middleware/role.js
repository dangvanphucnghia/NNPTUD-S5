const jwt = require('jsonwebtoken');

const isAdmin = (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực!'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user is admin
        if (!decoded.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập tài nguyên này!'
            });
        }

        // Add user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn!'
        });
    }
};

const isUser = (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực!'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Add user info to request
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn!'
        });
    }
};

module.exports = { isAdmin, isUser }; 