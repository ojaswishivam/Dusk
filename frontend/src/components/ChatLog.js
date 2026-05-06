import React, { useEffect, useState } from 'react'
import { ChatState } from '../Context/ChatProvider';
import { Box, Flex, Text, Avatar, Skeleton, SkeletonCircle, Input, InputGroup, InputLeftElement, Button } from '@chakra-ui/react';
import { IoSearchOutline, IoAdd } from "react-icons/io5";
import axios from 'axios'
import { getSender, getSenderDetails, isUserOnline } from '../config/ChatNameFunction';
import GroupChatModal from './miscellaneous/GroupChatModal';

const PANEL_BG = "rgba(18, 18, 20, 0.7)"
const BORDER = "rgba(255,255,255,0.05)"
const CARD_HOVER = "rgba(255,255,255,0.04)"
const CARD_ACTIVE = "rgba(255,255,255,0.07)"
const TEXT_PRIMARY = "rgba(255,255,255,0.92)"
const TEXT_MUTED = "rgba(255,255,255,0.38)"
const TEXT_SECONDARY = "rgba(255,255,255,0.55)"

const ChatLog = ({ fetchAgain }) => {
  const [loggedInUser, setLoggedInUser] = useState()
  const [loadingChats, setLoadingChats] = useState(false)
  const [chatSearch, setChatSearch] = useState("")
  const { user, selectedChat, setSelectedChat, chats, setChats, onlineUsers } = ChatState()

  const fetchChats = async () => {
    try {
      setLoadingChats(true)
      const config = { headers: { Authorization: `Bearer ${user.token}` } }
      const { data } = await axios.get("/api/chat", config)
      setChats(data)
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingChats(false)
    }
  }

  useEffect(() => {
    setLoggedInUser(JSON.parse(localStorage.getItem("userInfo")))
    fetchChats()
  }, [fetchAgain])

  const filteredChats = chats?.filter(c => {
    const name = !c.isGroupChat ? getSender(loggedInUser, c.users) : c.chatName
    return name?.toLowerCase().includes(chatSearch.toLowerCase())
  })

  const getTimestamp = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const d = new Date()
    return `${d.getDate()} ${months[d.getMonth()]}`
  }

  return (
    <Flex
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      direction="column"
      bg={PANEL_BG}
      w={{ base: "100%", md: "300px" }}
      borderRight={`1px solid ${BORDER}`}
      overflow="hidden"
      flexShrink={0}
    >
      {/* Header */}
      <Box px="5" pt="6" pb="4" borderBottom={`1px solid ${BORDER}`}>
        <Flex align="center" justify="space-between" mb="5">
          <Text fontSize="xl" fontWeight="700" color={TEXT_PRIMARY} letterSpacing="-0.02em">
            Messages
          </Text>
          <GroupChatModal>
            <Box
              w="28px" h="28px" borderRadius="8px"
              bg="rgba(255,255,255,0.08)" display="flex"
              alignItems="center" justifyContent="center"
              cursor="pointer" color={TEXT_SECONDARY}
              _hover={{ bg: "rgba(255,255,255,0.14)", color: "white" }}
              transition="0.15s" fontSize="16px"
            >
              <IoAdd />
            </Box>
          </GroupChatModal>
        </Flex>

        {/* Search */}
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none" color={TEXT_MUTED} children={<IoSearchOutline />} />
          <Input
            placeholder="Search"
            value={chatSearch}
            onChange={(e) => setChatSearch(e.target.value)}
            bg="rgba(255,255,255,0.06)"
            border="1px solid rgba(255,255,255,0.08)"
            borderRadius="10px"
            color={TEXT_PRIMARY}
            fontSize="13px"
            _placeholder={{ color: TEXT_MUTED }}
            _focus={{ bg: "rgba(255,255,255,0.09)", borderColor: "rgba(37,99,235,0.5)", boxShadow: "none" }}
          />
        </InputGroup>
      </Box>

      {/* Chat List */}
      <Box flex="1" overflowY="auto" className="hide-scrollbar" py="2">
        {loadingChats ? (
          Array(5).fill(0).map((_, i) => (
            <Flex key={i} px="4" py="3" align="center" gap="3">
              <SkeletonCircle size="10" startColor="whiteAlpha.100" endColor="whiteAlpha.300" />
              <Box flex="1">
                <Skeleton h="12px" mb="2" w="55%" startColor="whiteAlpha.100" endColor="whiteAlpha.300" />
                <Skeleton h="10px" w="75%" startColor="whiteAlpha.100" endColor="whiteAlpha.200" />
              </Box>
            </Flex>
          ))
        ) : filteredChats?.length > 0 ? (
          filteredChats.map((chat) => {
            const isActive = selectedChat?._id === chat._id
            const otherUser = !chat.isGroupChat ? getSenderDetails(loggedInUser, chat.users) : null
            const online = !chat.isGroupChat && onlineUsers?.includes(String(otherUser?._id))
            const chatName = !chat.isGroupChat ? getSender(loggedInUser, chat.users) : chat.chatName
            const latestPreview = chat.latestMessage?.imageUrl
              ? "📷 Photo"
              : chat.latestMessage?.content?.substring(0, 35) + (chat.latestMessage?.content?.length > 35 ? "..." : "")

            return (
              <Flex
                key={chat._id}
                onClick={() => setSelectedChat(chat)}
                align="center"
                gap="3"
                px="4"
                py="3"
                cursor="pointer"
                bg={isActive ? CARD_ACTIVE : "transparent"}
                _hover={{ bg: isActive ? CARD_ACTIVE : CARD_HOVER }}
                transition="background 0.12s"
                borderLeft={`2px solid ${isActive ? "#2563eb" : "transparent"}`}
                position="relative"
              >
                {/* Avatar */}
                <Box position="relative" flexShrink={0}>
                  <Avatar
                    size="md"
                    name={chatName}
                    src={otherUser?.pic}
                    borderRadius="12px"
                    bg="rgba(255,255,255,0.1)"
                  />
                  {online && (
                    <Box
                      position="absolute" bottom="-1px" right="-1px"
                      w="11px" h="11px" bg="#22c55e"
                      borderRadius="full" border="2px solid rgba(18,18,20,0.95)"
                    />
                  )}
                </Box>

                {/* Info */}
                <Box flex="1" overflow="hidden">
                  <Flex justify="space-between" align="center" mb="1">
                    <Text fontSize="14px" fontWeight="600" color={TEXT_PRIMARY} noOfLines={1}>
                      {chatName}
                    </Text>
                    <Text fontSize="10px" color={TEXT_MUTED} flexShrink={0} ml="2">
                      {getTimestamp()}
                    </Text>
                  </Flex>
                  <Text fontSize="12px" color={TEXT_SECONDARY} noOfLines={1}>
                    {latestPreview || "No messages yet"}
                  </Text>
                </Box>
              </Flex>
            )
          })
        ) : (
          <Flex h="100%" align="center" justify="center" direction="column" gap="2" py="12">
            <Text fontSize="sm" color={TEXT_MUTED}>No conversations</Text>
            <Text fontSize="xs" color={TEXT_MUTED}>Search for a user to start chatting</Text>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}

export default ChatLog
