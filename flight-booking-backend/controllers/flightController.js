const Flight = require("../models/Flight");
const { validationResult } = require('express-validator');
const cities = require("../models/locations");
const Airline = require('../models/Airline');

const flightController = {
    createFlight: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                airline,
                flightNumber,
                departure,
                arrival,
                aircraft,
                seatsAvailable,
                price,
                status
            } = req.body;

            // Validate departure and arrival times
            const departureTime = new Date(departure.time);
            const arrivalTime = new Date(arrival.time);
            const now = new Date();

            if (departureTime <= now) {
                return res.status(400).json({
                    success: false,
                    message: "Thời gian khởi hành phải sau thời điểm hiện tại"
                });
            }

            if (arrivalTime <= departureTime) {
                return res.status(400).json({
                    success: false,
                    message: "Thời gian đến phải sau thời gian khởi hành"
                });
            }

            if (departure.city === arrival.city) {
                return res.status(400).json({
                    success: false,
                    message: "Điểm đi và điểm đến không được trùng nhau"
                });
            }

            // Get the first airline if none is provided
            let airlineId = airline;
            if (!airlineId) {
                const firstAirline = await Airline.findOne({ isDeleted: false });
                if (!firstAirline) {
                    return res.status(400).json({
                        success: false,
                        message: "Không tìm thấy hãng bay nào trong hệ thống"
                    });
                }
                airlineId = firstAirline._id;
            }

            const newFlight = new Flight({
                airline: airlineId,
                flightNumber,
                departure: {
                    city: departure.city,
                    airport: departure.airport,
                    time: departureTime
                },
                arrival: {
                    city: arrival.city,
                    airport: arrival.airport,
                    time: arrivalTime
                },
                aircraft,
                seatsAvailable: parseInt(seatsAvailable),
                price: parseFloat(price),
                status: status || 'scheduled',
                isActive: true
            });

            const savedFlight = await newFlight.save();
            
            // Populate airline info for response
            const populatedFlight = await Flight.findById(savedFlight._id).populate('airline', 'name code logo');
            
            res.status(201).json({
                success: true,
                data: populatedFlight,
                message: "Tạo chuyến bay thành công"
            });
        } catch (err) {
            console.error('Error creating flight:', err);
            res.status(500).json({
                success: false,
                message: "Không thể tạo chuyến bay",
                error: err.message
            });
        }
    },

    getFlights: async (req, res) => {
        try {
            const {
                page = 1,
                limit = 10,
                departureCity,
                arrivalCity,
                departureDate,
                airline,
                status,
                minPrice,
                maxPrice
            } = req.query;

            // Build query
            const query = { isActive: true };
            
            if (departureCity) {
                query['departure.city'] = new RegExp(departureCity, 'i');
            }
            if (arrivalCity) {
                query['arrival.city'] = new RegExp(arrivalCity, 'i');
            }
            if (departureDate) {
                const startDate = new Date(departureDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(departureDate);
                endDate.setHours(23, 59, 59, 999);
                query['departure.time'] = { $gte: startDate, $lte: endDate };
            }
            if (airline) {
                query.airline = airline;
            }
            if (status) {
                query.status = status;
            }
            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = Number(minPrice);
                if (maxPrice) query.price.$lte = Number(maxPrice);
            }

            // Execute query with pagination
            const flights = await Flight.find(query)
                .populate('airline', 'name code logo')
                .sort({ 'departure.time': 1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const total = await Flight.countDocuments(query);

            res.json({
                success: true,
                data: flights,
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            });
        } catch (error) {
            console.error('Error fetching flights:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tải danh sách chuyến bay'
            });
        }
    },

    getAllFlights: async (req, res) => {
        try {
            const { includeDeleted } = req.query;
            // Convert string "true" to boolean true
            const showDeleted = includeDeleted === 'true';
            
            // If showDeleted is true, don't filter by isActive
            const query = showDeleted ? {} : { isActive: true };
            
            const flights = await Flight.find(query)
                .populate('airline', 'name code logo')
                .sort({ 'departure.time': 1 });
            
            res.json({
                success: true,
                data: flights
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Lỗi khi lấy danh sách chuyến bay"
            });
        }
    },

    getFlightById: async (req, res) => {
        try {
            const flight = await Flight.findById(req.params.id)
                .populate('airline', 'name code logo');

            if (!flight) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy chuyến bay'
                });
            }

            res.json({
                success: true,
                data: flight
            });
        } catch (error) {
            console.error('Error fetching flight:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể tải thông tin chuyến bay'
            });
        }
    },

    updateFlight: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const {
                flightNumber,
                departure,
                arrival,
                aircraft,
                seatsAvailable,
                price,
                status
            } = req.body;

            // Validate date times
            if (departure && arrival) {
                const departureTime = new Date(departure.time);
                const arrivalTime = new Date(arrival.time);

                if (arrivalTime <= departureTime) {
                    return res.status(400).json({
                        success: false,
                        message: "Thời gian đến phải sau thời gian khởi hành"
                    });
                }

                if (departure.city === arrival.city) {
                    return res.status(400).json({
                        success: false,
                        message: "Điểm đi và điểm đến không được trùng nhau"
                    });
                }
            }

            // Create update data object
            const updateData = {};
            
            if (flightNumber) updateData.flightNumber = flightNumber;
            
            if (departure) {
                updateData.departure = {
                    city: departure.city,
                    airport: departure.airport,
                    time: new Date(departure.time)
                };
            }
            
            if (arrival) {
                updateData.arrival = {
                    city: arrival.city,
                    airport: arrival.airport, 
                    time: new Date(arrival.time)
                };
            }
            
            if (aircraft) updateData.aircraft = aircraft;
            if (seatsAvailable !== undefined) updateData.seatsAvailable = parseInt(seatsAvailable);
            if (price !== undefined) updateData.price = parseFloat(price);
            if (status) updateData.status = status;

            const flight = await Flight.findByIdAndUpdate(
                req.params.id,
                updateData,
                { new: true, runValidators: true }
            ).populate('airline', 'name code logo');

            if (!flight) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy chuyến bay'
                });
            }

            res.json({
                success: true,
                data: flight,
                message: 'Cập nhật thông tin chuyến bay thành công'
            });
        } catch (error) {
            console.error('Error updating flight:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật thông tin chuyến bay',
                error: error.message
            });
        }
    },

    deleteFlight: async (req, res) => {
        try {
            const flight = await Flight.findByIdAndUpdate(
                req.params.id,
                { isActive: false },
                { new: true }
            ).populate('airline', 'name code logo');

            if (!flight) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy chuyến bay'
                });
            }

            res.json({
                success: true,
                data: flight,
                message: 'Xóa chuyến bay thành công'
            });
        } catch (error) {
            console.error('Error deleting flight:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể xóa chuyến bay'
            });
        }
    },

    restoreFlight: async (req, res) => {
        try {
            const flight = await Flight.findByIdAndUpdate(
                req.params.id,
                { isActive: true },
                { new: true }
            ).populate('airline', 'name code logo');

            if (!flight) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy chuyến bay'
                });
            }

            res.json({
                success: true,
                data: flight,
                message: 'Khôi phục chuyến bay thành công'
            });
        } catch (error) {
            console.error('Error restoring flight:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể khôi phục chuyến bay'
            });
        }
    },

    updateFlightStatus: async (req, res) => {
        try {
            const { status } = req.body;
            
            if (!['scheduled', 'delayed', 'cancelled', 'completed'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Trạng thái chuyến bay không hợp lệ'
                });
            }

            const flight = await Flight.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            ).populate('airline', 'name code logo');

            if (!flight) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy chuyến bay'
                });
            }

            res.json({
                success: true,
                data: flight,
                message: 'Cập nhật trạng thái chuyến bay thành công'
            });
        } catch (error) {
            console.error('Error updating flight status:', error);
            res.status(500).json({
                success: false,
                message: 'Không thể cập nhật trạng thái chuyến bay'
            });
        }
    },

    getLocations: async (req, res) => {
        try {
            res.json({
                success: true,
                data: cities
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Lỗi khi lấy danh sách địa điểm"
            });
        }
    }
};

module.exports = flightController;