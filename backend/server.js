const express = require('express')
const { chats } = require('./data/data')
const connectDB = require('./config/db')
const dotenv = require('dotenv')
const colors = require('colors')
console.log(">> SERVER LIVE: DEBUGGING ENABLED <<".cyan.underline)
const path = require('path')
const cors = require('cors')
const userRoutes = require('./routes/userRoutes')
const chatRoutes = require('./routes/chatRoutes')
const messageRoutes = require('./routes/messageRoutes')
const { errorHandler, notFound } = require('./middleware/errorMiddleware')
const rateLimit = require('express-rate-limit')

dotenv.config()
connectDB()

const app = express()
app.set('trust proxy', 1)

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Too many requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false },
})


app.use('/api', apiLimiter)

const __dirname1 = path.resolve()

// Middleware
app.use(express.json())
app.use(cors())

// API Routes
app.use('/api/user', userRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/message', messageRoutes)

// --------------------------deployment------------------------------

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error handling middlewares
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`.yellow.bold)
})

// Socket.io setup
const io = require('socket.io')(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.NODE_ENV === "production" ? "*" : ["http://localhost:3000", "http://127.0.0.1:3000"],
  },
})

let onlineUsers = new Set();

io.on('connection', (socket) => {
  console.log('connected to socket.io')

  socket.on('setup', (userData) => {
    socket.join(userData._id)
    socket.userId = userData._id; // Store userId on socket
    onlineUsers.add(userData._id);
    io.emit('online users', Array.from(onlineUsers));
    socket.emit('connected')
  })

  socket.on('chat connect', (room) => {
    socket.join(room)
    console.log('chatId : ' + room)
  })

  socket.on('typing', (room) => socket.in(room).emit('typing'))
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'))

  socket.on('New Message', (NewMessageReceived) => {
    var chat = NewMessageReceived.chat
    if (!chat.users) return console.log('users of this chat are undefined')

    chat.users.forEach((user) => {
      if (user._id == NewMessageReceived.sender._id) return
      socket.in(user._id).emit('message received', NewMessageReceived)
    })
  })

  socket.on('message read', (data) => {
    socket.in(data.room).emit('message read', data)
  })

  socket.on('message edit', (data) => {
    socket.in(data.room).emit('message edit', data)
  })

  socket.on('message delete', (data) => {
    socket.in(data.room).emit('message delete', data)
  })

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('online users', Array.from(onlineUsers));
    }
  });

  socket.off('setup', () => {
    socket.leave(socket.userId)
    onlineUsers.delete(socket.userId);
    io.emit('online users', Array.from(onlineUsers));
  })
})
