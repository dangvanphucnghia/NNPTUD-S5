const Airline = require('../models/Airline');

// Get all airlines with optional includeDeleted parameter
exports.getAllAirlines = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === 'true';
        const query = includeDeleted ? {} : { isDeleted: false };
        
        const airlines = await Airline.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: airlines
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all deleted airlines
exports.getDeletedAirlines = async (req, res) => {
    try {
        const deletedAirlines = await Airline.find({ isDeleted: true });
        res.status(200).json({
            success: true,
            data: deletedAirlines
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single airline
exports.getAirline = async (req, res) => {
    try {
        const airline = await Airline.findOne({ 
            _id: req.params.id,
            isDeleted: false 
        });
        
        if (!airline) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hãng bay'
            });
        }

        res.status(200).json({
            success: true,
            data: airline
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Restore deleted airline
exports.restoreAirline = async (req, res) => {
    try {
        const airline = await Airline.findOneAndUpdate(
            { _id: req.params.id, isDeleted: true },
            { 
                isDeleted: false,
                deletedAt: null
            },
            { new: true }
        );

        if (!airline) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hãng bay đã xóa'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Khôi phục hãng bay thành công',
            data: airline
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Create new airline
exports.createAirline = async (req, res) => {
    try {
        const airlineData = {
            ...req.body,
            isDeleted: false
        };
        const airline = await Airline.create(airlineData);
        res.status(201).json({
            success: true,
            data: airline
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Update airline
exports.updateAirline = async (req, res) => {
    try {
        const airline = await Airline.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            req.body,
            { new: true, runValidators: true }
        );

        if (!airline) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hãng bay'
            });
        }

        res.status(200).json({
            success: true,
            data: airline
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Soft delete airline
exports.deleteAirline = async (req, res) => {
    try {
        const airline = await Airline.findOneAndUpdate(
            { _id: req.params.id, isDeleted: false },
            { 
                isDeleted: true,
                deletedAt: Date.now()
            },
            { new: true }
        );

        if (!airline) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy hãng bay'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Xóa hãng bay thành công',
            data: airline
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 