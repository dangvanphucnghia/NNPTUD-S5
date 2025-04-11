const User = require('../models/User');
const bcrypt = require('bcrypt');

const userController = {
    // Lấy danh sách tất cả người dùng (không bao gồm admin)
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find({ admin: false })
                .select('username email password createdAt updatedAt')
                .sort({ createdAt: -1 });
            
            console.log("Fetched users:", users); // Debugging log

            res.status(200).json({
                message: "Lấy danh sách người dùng thành công",
                users: users,
                total: users.length
            });
        } catch (error) {
            console.error("Error fetching users:", error.message); // Debugging log
            res.status(500).json({ message: error.message });
        }
    },

    // Lấy thông tin một người dùng
    getUserById: async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
                .select('username email password createdAt updatedAt');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.status(200).json({
                message: "Lấy thông tin người dùng thành công",
                user: user
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Tạo người dùng mới
    createUser: async (req, res) => {
        try {
            const { username, email, password } = req.body;

            // Kiểm tra username và email đã tồn tại
            const existingUser = await User.findOne({ $or: [{ username }, { email }] });
            if (existingUser) {
                return res.status(400).json({ message: 'Username or email already exists' });
            }

            // Tạo user mới (luôn là user thường, không phải admin)
            const newUser = new User({
                username,
                email,
                password,
                admin: false
            });

            const savedUser = await newUser.save();
            
            res.status(201).json({
                message: "Tạo người dùng thành công",
                user: savedUser
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Cập nhật thông tin người dùng
    updateUser: async (req, res) => {
        try {
            const { username, password } = req.body;
            const userId = req.params.id;

            // Kiểm tra user có tồn tại và không phải admin
            const existingUser = await User.findById(userId);
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (existingUser.admin) {
                return res.status(403).json({ message: 'Cannot modify admin user' });
            }

            const updateData = { username };
            if (password) {
                updateData.password = password;
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                updateData,
                { new: true }
            ).select('username email password createdAt updatedAt');

            res.status(200).json({
                message: "Cập nhật thông tin người dùng thành công",
                user: updatedUser
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Xóa người dùng
    deleteUser: async (req, res) => {
        try {
            // Kiểm tra user có tồn tại và không phải admin
            const existingUser = await User.findById(req.params.id);
            if (!existingUser) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (existingUser.admin) {
                return res.status(403).json({ message: 'Cannot delete admin user' });
            }

            await User.findByIdAndDelete(req.params.id);
            res.status(200).json({ 
                message: 'Xóa người dùng thành công',
                deletedUserId: req.params.id
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = userController;