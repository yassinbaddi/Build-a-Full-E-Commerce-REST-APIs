const mongoose = require('mongoose');

async function startServer() {
    try {
        await mongoose.connect(process.env.URI);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        throw err;
    }
}

module.exports = { startServer };