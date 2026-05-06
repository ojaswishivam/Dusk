import { Flex, Box, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, Input, Button, Spinner, useToast, Text } from "@chakra-ui/react"
import { ChatState } from "../Context/ChatProvider"
import SideBar from "../components/miscellaneous/SideBar"
import ChatLog from "../components/ChatLog"
import ChatBox from "../components/ChatBox"
import { useState } from "react"
import axios from "axios"
import UserListItem from "../components/UserCard/UserListItem"
import ChatLoading from "../components/ChatLoading"

// Beautiful scenic background from Unsplash
const BG_IMAGE = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=2065&auto=format&fit=crop"

const ChatPage = () => {
  const { user, setSelectedChat, chats, setChats } = ChatState()
  const [fetchAgain, setFetchAgain] = useState(false)
  const [search, setSearch] = useState("")
  const [searchResult, setSearchresult] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingChats, setLoadingChats] = useState(false)

  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const handleSearch = async () => {
    if (!search) {
      toast({ title: "Please enter something to search", status: "warning", duration: 3000, position: "top" })
      return
    }
    try {
      setLoading(true)
      const config = { headers: { Authorization: `Bearer ${user.token}` } }
      const { data } = await axios.get(`/api/user/alluser?search=${search}`, config)
      setLoading(false)
      setSearchresult(data)
    } catch (error) {
      toast({ title: "Search failed", status: "error", duration: 3000 })
      setLoading(false)
    }
  }

  const accessChats = async (userId) => {
    try {
      setLoadingChats(true)
      const config = { headers: { "Content-type": "application/json", Authorization: `Bearer ${user.token}` } }
      const { data } = await axios.post("/api/chat", { userId }, config)
      if (!chats.find((c) => c._id === data._id)) setChats([data, ...chats])
      setSelectedChat(data)
      setLoadingChats(false)
      onClose()
    } catch (error) {
      toast({ title: "Error accessing chat", status: "error", duration: 3000 })
    }
  }

  return (
    <Box
      w="100vw"
      h="100vh"
      position="relative"
      overflow="hidden"
    >
      {/* Full-Screen Background */}
      <Box
        position="absolute"
        inset="0"
        bgImage={`url('${BG_IMAGE}')`}
        bgSize="cover"
        bgPosition="center"
        filter="brightness(0.55)"
        zIndex={0}
      />
      {/* Subtle dark gradient overlay */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(10,10,30,0.4) 100%)"
        zIndex={1}
      />

      {/* Floating Glass App Panel */}
      <Flex
        position="absolute"
        inset="0"
        align="center"
        justify="center"
        zIndex={2}
        p={{ base: "0", md: "28px" }}
      >
        <Flex
          className="glass-panel"
          w="100%"
          h="100%"
          maxW="1300px"
          maxH="860px"
          overflow="hidden"
        >
          {user && <SideBar onSearchOpen={onOpen} />}
          <Flex flex="1" overflow="hidden">
            {user && <ChatLog fetchAgain={fetchAgain} />}
            {user && <ChatBox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />}
          </Flex>
        </Flex>
      </Flex>

      {/* Search Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay backdropFilter="blur(8px)" bg="rgba(0,0,0,0.6)" />
        <DrawerContent bg="#1C1C1E" color="white" borderRight="1px solid rgba(255,255,255,0.08)">
          <DrawerCloseButton color="whiteAlpha.700" />
          <DrawerHeader borderBottomWidth="1px" borderColor="rgba(255,255,255,0.06)" color="white">
            Search Users
          </DrawerHeader>
          <DrawerBody>
            <Box display="flex" pb="3" mt="3" gap="2">
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg="rgba(255,255,255,0.06)"
                border="1px solid rgba(255,255,255,0.1)"
                color="white"
                _placeholder={{ color: "whiteAlpha.400" }}
                borderRadius="xl"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button colorScheme="blue" onClick={handleSearch} borderRadius="xl" px="6">Go</Button>
            </Box>
            {loading ? <ChatLoading /> : (
              searchResult?.map((u) => (
                <UserListItem key={u._id} user={u} handleFunction={() => accessChats(u._id)} />
              ))
            )}
            {loadingChats && <Spinner ml="auto" display="flex" color="blue.400" mt="4" />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default ChatPage
