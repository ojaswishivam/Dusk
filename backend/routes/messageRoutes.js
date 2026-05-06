const express = require("express")
const { protect } = require("../middleware/authMiddleware")
const { sendMessage, fetchMessage, markAsRead, editMessage, deleteMessage } = require("../controllers/messageControllers")

const router = express.Router()

router.route("/").post(protect, sendMessage)
router.route("/read").put(protect, markAsRead)
router.route("/:messageId").put(protect, editMessage).delete(protect, deleteMessage)
router.route("/:chatId").get(protect, fetchMessage)

module.exports = router