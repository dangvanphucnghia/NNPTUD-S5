const express = require("express");
const flightController = require("../controllers/flightController"); 
const authAdmin = require('../middleware/authAdmin');

const router = express.Router();

// Public routes
router.get("/locations", flightController.getLocations);

// Protected routes
router.get("/all", authAdmin, flightController.getAllFlights);
router.get("/", flightController.getFlights);
router.get("/:id", flightController.getFlightById);

// Admin only routes
router.post("/", authAdmin, flightController.createFlight);
router.put("/:id", authAdmin, flightController.updateFlight);
router.delete("/:id", authAdmin, flightController.deleteFlight);
router.patch("/:id/restore", authAdmin, flightController.restoreFlight);

module.exports = router;
