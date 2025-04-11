const { verifyToken } = require("./authMiddleware");

const authAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        console.log("Authenticated user:", req.user); // Debugging log
        if (!req.user || req.user.admin !== true) {
            console.error("Access denied. Not an admin.");
            return res.status(403).json({ message: "Access denied. Admins only" });
        }
        next();
    });
};

module.exports = authAdmin;