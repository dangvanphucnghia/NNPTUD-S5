const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authController = {
    // REGISTER USER
    registerUser: async (req, res) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(req.body.password, salt);

            // Create new user
            const newUser = new User({
                username: req.body.username,
                email: req.body.email,
                password: hashed,
                admin: req.body.admin || false
            });

            const savedUser = await newUser.save();

            // Remove password from response
            const userResponse = savedUser.toObject();
            delete userResponse.password;
            
            res.status(201).json(savedUser);
        } catch (err) {
            res.status(500).json({ error: "Registration failed", details: err });
        }
    },

    // LOGIN USER
    loginUser: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: "Email and password are required" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Email không tồn tại!" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Mật khẩu không đúng!" });
            }

            // Tạo JWT Token
            const token = jwt.sign(
                { userId: user._id, email: user.email, admin: user.admin }, // ✅ Thêm quyền admin vào token
                process.env.JWT_SECRET || "default_secret",
                { expiresIn: "1h" }
            );
            

            res.status(200).json({
                message: "Đăng nhập thành công!",
                token,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    roles: user.admin ? ["admin"] : ["user"]
                }
            });
        } catch (err) {
            res.status(500).json({ error: "Error logging in", details: err });
        }
    },
    // CHANGE PASSWORD
    changePassword: async (req, res) => {
        try {
            const { username, oldPassword, newPassword } = req.body;
            
            // Tìm user theo username
            const user = await User.findOne({ username: username });
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }

            // Kiểm tra mật khẩu cũ có đúng không
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
            }

            // Mã hóa và lưu mật khẩu mới
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();
            
            res.json({ message: "Đổi mật khẩu thành công" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
    getUserProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.userId)
                .select('-password');
            
            if (!user) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }

            res.json({
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    admin: user.admin,
                    roles: user.admin ? ["admin"] : ["user"]
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    },
    updateProfile: async (req, res) => {
        try {
            const { username, email } = req.body;
            const userId = req.user.userId;

            // Kiểm tra email mới có bị trùng không
            if (email) {
                const existingUser = await User.findOne({ 
                    email, 
                    _id: { $ne: userId } 
                });
                if (existingUser) {
                    return res.status(400).json({ message: "Email đã được sử dụng" });
                }
            }

            // Cập nhật thông tin
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { username, email } },
                { new: true, select: '-password' }
            );

            if (!updatedUser) {
                return res.status(404).json({ message: "Không tìm thấy người dùng" });
            }

            res.json({
                message: "Cập nhật thông tin thành công",
                user: updatedUser
            });

        } catch (error) {
            console.error("Update profile error:", error);
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }

};

module.exports = authController;
