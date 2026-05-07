const mongoose = require("mongoose")

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
            socketTimeoutMS: 45000, 
        })

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`.cyan.underline.bold)
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`.red.bold)
        if (error.message.includes('ECONNREFUSED')) {
            console.log(`💡 Tip: This often means your DNS is blocking the connection or your IP isn't whitelisted.`.yellow)
        }
        process.exit(1)
    }
}

module.exports = connectDB