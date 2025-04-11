const express = require('express');
const router = express.Router();
const authAdmin = require('../middleware/authAdmin');
const {
    getAllAirlines,
    getAirline,
    createAirline,
    updateAirline,
    deleteAirline,
    restoreAirline
} = require('../controllers/airlineController');

// Public routes
router.get('/', getAllAirlines);
router.get('/:id', getAirline);

// Admin only routes
router.post('/', authAdmin, createAirline);
router.put('/:id', authAdmin, updateAirline);
router.delete('/:id', authAdmin, deleteAirline);
router.patch('/:id/restore', authAdmin, restoreAirline);

module.exports = router; 