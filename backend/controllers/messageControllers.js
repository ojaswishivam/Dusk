const asyncHandler = require("express-async-handler");
const Message = require("../Models/messageModel");
const Chat = require("../Models/chatModel");
const User = require("../Models/userModel")

const sendMessage = asyncHandler(async (req, res) => {
    console.log("FULL REQUEST BODY:", JSON.stringify(req.body, null, 2));
    const { content, chatId, imageUrl } = req.body
    
    if((!content && !imageUrl) || !chatId){
        console.log("Invalid data passed into request");
        return res.sendStatus(400)
    }

    var msgData = {
        sender: req.user._id,
        content: content || "",
        imageUrl: imageUrl || null,
        chat: chatId,
        readBy: [req.user._id]
    }

    try {
        var msg = await Message.create(msgData)
        msg = await msg.populate("sender", "name pic")
        msg = await msg.populate("chat")
        msg = await User.populate(msg, {
            path: "chat.users",
            select: "name pic email"
        })

        await Chat.findByIdAndUpdate(req.body.chatId , {
            latestMessage: msg
        })

        res.status(201).json(msg)
    } catch (error) {
        res.status(400)
        throw new Error(error.message)
    }
})

const fetchMessage = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name pic email")
            .populate("chat")
            .sort({ createdAt: -1 }) // Sort by newest first for easier pagination
            .skip(skip)
            .limit(limit);

        res.status(200).json(messages.reverse()); // Reverse back to chronological order
    } catch (error) {
        res.status(404)
        throw new Error(error.message)
    }
})

const markAsRead = asyncHandler(async (req, res) => {
    try {
        await Message.updateMany(
            { chat: req.body.chatId, readBy: { $ne: req.user._id } },
            { $addToSet: { readBy: req.user._id } }
        );
        res.json({ message: "Messages marked as read" });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const deleteMessage = asyncHandler(async (req, res) => {
    try {
        await Message.findByIdAndDelete(req.params.messageId);
        res.json({ message: "Message deleted" });
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

const editMessage = asyncHandler(async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.messageId,
            { content: req.body.content },
            { new: true }
        ).populate("sender", "name pic email").populate("chat");
        
        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = { sendMessage , fetchMessage, markAsRead, deleteMessage, editMessage }