import React from 'react'
import { ChatState } from '../Context/ChatProvider'
import { Flex, useColorModeValue } from '@chakra-ui/react'
import SingleChat from "./SingleChat"

const ChatBox = ({ fetchAgain, setFetchAgain }) => {
  const { selectedChat } = ChatState()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Flex
      display={{ base: selectedChat ? "flex" : "none", md: "flex" }}
      direction="column"
      bg={bg}
      flex="1"
      overflow="hidden"
      borderLeft="1px solid"
      borderColor={borderColor}
    >
      <SingleChat fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
    </Flex>
  )
}

export default ChatBox
