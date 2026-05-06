import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChatState } from '../Context/ChatProvider'
import {
  Box, Flex, IconButton, Input, Spinner, Text, Avatar, Tooltip, useToast
} from '@chakra-ui/react'
import { IoArrowBack, IoSend, IoHappyOutline } from "react-icons/io5"
import { MdAddPhotoAlternate } from "react-icons/md"
import { getSender, getSenderDetails } from '../config/ChatNameFunction'
import ProfileModal from './miscellaneous/ProfileModal'
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal'
import axios from 'axios'
import ScrollChat from './ScrollChat'
import Lottie from "react-lottie"
import animationData from "../animations/typing.json"
import EmojiPicker from 'emoji-picker-react'

const WORKSPACE_BG = "rgba(14, 14, 16, 0.6)"
const HEADER_BG = "rgba(16, 16, 18, 0.8)"
const INPUT_AREA_BG = "rgba(14, 14, 16, 0.7)"
const BORDER = "rgba(255,255,255,0.06)"
const TEXT_PRIMARY = "rgba(255,255,255,0.92)"
const TEXT_MUTED = "rgba(255,255,255,0.4)"

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [message, setMessage] = useState([])
  const [NewMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const [istyping, setIstyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)

  const selectedChatCompare = useRef(null)
  const emojiPickerRef = useRef(null)
  const fileInputRef = useRef(null)

  const defaultOptions = {
    loop: true, autoplay: true, animationData,
    rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
  }

  const toast = useToast()
  const { user, selectedChat, setSelectedChat, setNotification, onlineUsers, socket, socketConnected } = ChatState()

  const isOnline = selectedChat && !selectedChat.isGroupChat &&
    onlineUsers?.includes(String(getSenderDetails(user, selectedChat.users)?._id))

  const markMessagesAsRead = useCallback(async () => {
    if (!selectedChat || !socket) return
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}`, "Content-type": "application/json" } }
      await axios.put("/api/message/read", { chatId: selectedChat._id }, config)
      socket.emit("message read", { room: selectedChat._id, userId: user._id })
    } catch (err) { }
  }, [selectedChat, socket, user])

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return
    try {
      setLoading(true)
      const config = { headers: { Authorization: `Bearer ${user.token}` } }
      const { data } = await axios.get(`/api/message/${selectedChat._id}`, config)
      setMessage(data)
      if (socket) socket.emit("chat connect", selectedChat._id)
    } catch (error) { } finally { setLoading(false) }
  }, [selectedChat, socket, user])

  const sendMessages = async (e) => {
    e?.preventDefault()
    if (!NewMessage.trim()) return
    if (socket) socket.emit("stop typing", selectedChat._id)
    setTyping(false)
    try {
      const config = { headers: { "Content-type": "application/json", Authorization: `Bearer ${user.token}` } }
      const content = NewMessage.trim()
      setNewMessage("")
      const { data } = await axios.post("/api/message", { content, chatId: selectedChat._id }, config)
      if (socket) socket.emit("New Message", data)
      setMessage(prev => [...prev, data])
    } catch (error) { }
  }

  const sendImageMessage = async (imageUrl) => {
    try {
      const config = { headers: { "Content-type": "application/json", Authorization: `Bearer ${user.token}` } }
      const { data } = await axios.post("/api/message", { 
        content: "Shared a photo", 
        imageUrl, 
        chatId: selectedChat._id 
      }, config)
      if (socket) socket.emit("New Message", data)
      setMessage(prev => [...prev, data])
    } catch (error) {
      toast({ 
        title: "Failed to save image", 
        description: error.response?.data?.message || "Server error while saving photo message", 
        status: "error", 
        duration: 4000 
      })
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageUploading(true)
    const formData = new FormData()
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "duyovaqta";
    const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "chat_app";

    formData.append("file", file)
    formData.append("upload_preset", uploadPreset)
    formData.append("cloud_name", cloudName)
    
    toast({ title: "Uploading image...", status: "info", duration: 2000, isClosable: true })

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData })
      const result = await res.json()
      if (result.secure_url) {
        console.log("SUCCESS: Cloudinary URL generated:", result.secure_url);
        await sendImageMessage(result.secure_url)
      } else {
        toast({ 
          title: "Upload Error", 
          description: result.error?.message || "Could not upload to Cloudinary. Check your Preset name.", 
          status: "error",
          duration: 5000
        })
      }
    } catch (err) {
      toast({ title: "Network Error", description: "Could not reach Cloudinary", status: "error", duration: 4000 })
    } finally {
      setImageUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } }
      await axios.delete(`/api/message/${messageId}`, config)
      if (socket) socket.emit("message delete", { _id: messageId, room: selectedChat._id })
      setMessage(prev => prev.filter(m => m._id !== messageId))
    } catch (error) { }
  }

  const editMessage = async (messageId, content) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}`, "Content-type": "application/json" } }
      const { data } = await axios.put(`/api/message/${messageId}`, { content }, config)
      if (socket) socket.emit("message edit", { ...data, room: selectedChat._id })
      setMessage(prev => prev.map(m => m._id === messageId ? data : m))
    } catch (error) { }
  }

  useEffect(() => {
    if (!socket) return
    const handleTyping = () => setIstyping(true)
    const handleStopTyping = () => setIstyping(false)
    const handleMsgRead = (d) => setMessage(prev => prev.map(m => (m.readBy && !m.readBy.includes(d.userId)) ? { ...m, readBy: [...m.readBy, d.userId] } : m))
    const handleMsgEdit = (d) => setMessage(prev => prev.map(m => m._id === d._id ? d : m))
    const handleMsgDelete = (d) => setMessage(prev => prev.filter(m => m._id !== d._id))
    const handleMsgReceived = (newMsg) => {
      if (!selectedChatCompare.current || selectedChatCompare.current._id !== newMsg.chat._id) {
        setNotification(prev => (!prev.some(n => n._id === newMsg._id)) ? [newMsg, ...prev] : prev)
        setFetchAgain(prev => !prev)
      } else {
        setMessage(prev => [...prev, newMsg])
        markMessagesAsRead()
      }
    }
    socket.on("typing", handleTyping); socket.on("stop typing", handleStopTyping)
    socket.on("message read", handleMsgRead); socket.on("message edit", handleMsgEdit)
    socket.on("message delete", handleMsgDelete); socket.on("message received", handleMsgReceived)
    return () => {
      socket.off("typing"); socket.off("stop typing"); socket.off("message read")
      socket.off("message edit"); socket.off("message delete"); socket.off("message received")
    }
  }, [socket, selectedChat, markMessagesAsRead, setFetchAgain, setNotification])

  useEffect(() => {
    fetchMessages(); markMessagesAsRead(); selectedChatCompare.current = selectedChat
  }, [selectedChat, fetchMessages, markMessagesAsRead])

  useEffect(() => {
    const h = (e) => { if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) setShowEmojiPicker(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const typingHandler = (e) => {
    setNewMessage(e.target.value)
    if (!socket || !socketConnected || !selectedChat) return
    if (!typing) { setTyping(true); socket.emit("typing", selectedChat._id) }
    const t = new Date().getTime()
    setTimeout(() => { if (new Date().getTime() - t >= 2500 && typing) { socket.emit("stop typing", selectedChat._id); setTyping(false) } }, 2500)
  }

  if (!selectedChat) {
    return (
      <Flex flex="1" h="100%" align="center" justify="center" direction="column" gap="3" bg={WORKSPACE_BG}>
        <Box fontSize="48px">💬</Box>
        <Text color={TEXT_MUTED} fontWeight="500">Select a conversation to start chatting</Text>
        <Text color="rgba(255,255,255,0.2)" fontSize="sm">Your messages are end-to-end secured</Text>
      </Flex>
    )
  }

  const senderDetails = !selectedChat.isGroupChat ? getSenderDetails(user, selectedChat.users) : null
  const senderName = !selectedChat.isGroupChat ? getSender(user, selectedChat.users) : selectedChat.chatName

  return (
    <Flex direction="column" flex="1" h="100%" overflow="hidden">
      {/* Dark Header */}
      <Flex
        align="center"
        px="6"
        py="4"
        bg={HEADER_BG}
        borderBottom={`1px solid ${BORDER}`}
        gap="3"
        flexShrink={0}
      >
        <IconButton
          display={{ base: "flex", md: "none" }}
          icon={<IoArrowBack />}
          variant="ghost"
          color="whiteAlpha.700"
          _hover={{ bg: "whiteAlpha.100" }}
          onClick={() => setSelectedChat("")}
          borderRadius="10px"
        />
        <Box position="relative">
          <Avatar
            size="sm"
            name={senderName}
            src={senderDetails?.pic}
            borderRadius="10px"
            bg="rgba(255,255,255,0.1)"
          />
          {isOnline && (
            <Box
              position="absolute" bottom="-1px" right="-1px"
              w="9px" h="9px" bg="#22c55e"
              borderRadius="full" border="2px solid rgba(16,16,18,0.9)"
            />
          )}
        </Box>
        <Box flex="1">
          <Text fontWeight="600" fontSize="15px" color={TEXT_PRIMARY} lineHeight="1.2">
            {senderName}
          </Text>
          <Text fontSize="11px" color={isOnline ? "#22c55e" : TEXT_MUTED}>
            {isOnline ? "Online" : "Offline"}
          </Text>
        </Box>
        {!selectedChat.isGroupChat ? (
          <ProfileModal user={senderDetails} />
        ) : (
          <UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} fetchMessages={fetchMessages} />
        )}
      </Flex>

      {/* Message area */}
      <Box flex="1" overflowY="auto" bg={WORKSPACE_BG} px="6" py="4" className="hide-scrollbar">
        {loading ? (
          <Flex justify="center" align="center" h="100%">
            <Spinner size="lg" color="blue.400" thickness="2px" />
          </Flex>
        ) : (
          <ScrollChat message={message} onDelete={deleteMessage} onEdit={editMessage} />
        )}
        {istyping && (
          <Lottie options={defaultOptions} width={50} style={{ marginLeft: 0, filter: "invert(0.8)" }} />
        )}
      </Box>

      {/* Input */}
      <Box px="5" py="4" bg={INPUT_AREA_BG} borderTop={`1px solid ${BORDER}`} position="relative">
        {showEmojiPicker && (
          <Box ref={emojiPickerRef} position="absolute" bottom="75px" left="60px" zIndex={1000} borderRadius="xl" overflow="hidden" boxShadow="0 20px 60px rgba(0,0,0,0.5)">
            <EmojiPicker onEmojiClick={(e) => setNewMessage(v => v + e.emoji)} theme="dark" width={320} height={380} />
          </Box>
        )}
        <Flex as="form" onSubmit={sendMessages} align="center" gap="2">
          <Tooltip label="Emoji" hasArrow>
            <Box
              as="button" type="button"
              onClick={() => setShowEmojiPicker(v => !v)}
              fontSize="22px" color={showEmojiPicker ? "blue.400" : TEXT_MUTED}
              p="2" borderRadius="10px"
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
              transition="0.15s" cursor="pointer"
            >
              <IoHappyOutline />
            </Box>
          </Tooltip>
          <Tooltip label="Send Photo" hasArrow>
            <Box
              as="button" type="button"
              onClick={() => fileInputRef.current?.click()}
              fontSize="22px" color={imageUploading ? "blue.400" : TEXT_MUTED}
              p="2" borderRadius="10px"
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
              transition="0.15s" cursor="pointer"
            >
              <MdAddPhotoAlternate />
            </Box>
          </Tooltip>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
          <Input
            flex="1"
            value={NewMessage}
            onChange={typingHandler}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessages() } }}
            placeholder="Type a message..."
            bg="rgba(255,255,255,0.06)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="12px"
            color={TEXT_PRIMARY}
            fontSize="14px"
            _placeholder={{ color: TEXT_MUTED }}
            _focus={{ bg: "rgba(255,255,255,0.09)", borderColor: "rgba(37,99,235,0.5)", boxShadow: "none" }}
          />
          <Box
            as="button"
            type="submit"
            w="40px" h="40px"
            borderRadius="12px"
            bg={NewMessage.trim() ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(255,255,255,0.06)"}
            color={NewMessage.trim() ? "white" : TEXT_MUTED}
            display="flex" alignItems="center" justifyContent="center"
            fontSize="18px"
            cursor={NewMessage.trim() ? "pointer" : "not-allowed"}
            flexShrink={0}
            transition="all 0.15s"
            boxShadow={NewMessage.trim() ? "0 4px 12px rgba(37,99,235,0.4)" : "none"}
            _hover={NewMessage.trim() ? { transform: "scale(1.05)" } : {}}
          >
            <IoSend />
          </Box>
        </Flex>
      </Box>
    </Flex>
  )
}

export default SingleChat
