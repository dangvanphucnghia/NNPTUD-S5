require('dotenv').config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const flightRoutes = require("./routes/flight");
const userRoutes = require("./routes/user");
const airlineRoutes = require("./routes/airline");
const ticketRoutes = require('./routes/ticket');
const paymentRoute = require('./routes/paymentRoute');
const promotionRoutes = require('./routes/promotionRoutes');

const app = express();
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json());
app.use(cookieParser());

//Routes
app.use("/v1/auth", authRoutes);
app.use("/v1/flights", flightRoutes);
app.use("/v1/users", userRoutes);
app.use("/v1/airlines", airlineRoutes);
app.use('/v1/tickets', ticketRoutes); 
app.use('/api/payment', paymentRoute);
app.use('/v1/promotions', promotionRoutes);

app.listen(8000, () => {
    console.log("Server is running");
});
