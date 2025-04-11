const jwt = require("jsonwebtoken");
const User = require('../models/User');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        console.error("No token provided");
        return res.status(401).json({ message: "Unauthorized! No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
        console.log("Decoded token:", decoded); // Debugging log
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Token verification failed:", err.message); // Debugging log
        return res.status(403).json({ message: "Invalid token" });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.admin !== true) {
        console.error("Access denied. Admins only. User:", req.user); // Debugging log
        return res.status(403).json({ message: "Access denied. Admins only" });
    }
    next();
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user?.admin ? "admin" : "user";
        console.log("User role:", userRole, "Required roles:", roles); // Debugging log
        if (!req.user || !roles.includes(userRole)) {
            console.error("Access denied. Insufficient permissions. User:", req.user); // Debugging log
            return res.status(403).json({ message: "Access denied. Insufficient permissions" });
        }
        next();
    };
};



module.exports = { verifyToken, isAdmin, authorizeRoles};
