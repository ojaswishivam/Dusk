import React, { useState } from 'react';
import ScrollableFeed from 'react-scrollable-feed';
import { isLastMessage, isSameSender } from '../config/ChatNameFunction';
import { ChatState } from '../Context/ChatProvider';
import {
  Box, Tooltip, Avatar, Menu, MenuButton, MenuList, MenuItem,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Input, Button, useDisclosure, Image, Flex, Text,
} from '@chakra-ui/react';
import { IoCheckmarkSharp, IoCheckmarkDoneSharp } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";

const isOnlyEmoji = (str) => {
  if (!str || !str.trim()) return false;
  const clean = str.trim();
  const emojiRegex = /^\p{Emoji}+$/u;
  return emojiRegex.test(clean) && clean.length <= 10;
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.toDateString() === date2.toDateString();
};

const ScrollChat = ({ message, onDelete, onEdit }) => {
  const { user } = ChatState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editContent, setEditContent] = useState('');
  const [editingMsg, setEditingMsg] = useState(null);

  const handleEditOpen = (msg) => { setEditingMsg(msg); setEditContent(msg.content); onOpen(); };
  const handleEditSubmit = () => { if (editContent.trim() && editingMsg) onEdit(editingMsg._id, editContent.trim()); onClose(); };

  return (
    <>
      <ScrollableFeed>
        {message && message.map((m, i) => {
          const isMe = m.sender._id === user._id;
          const isEmoji = !m.imageUrl && isOnlyEmoji(m.content);
          const showAvatar = !isMe && (isSameSender(message, m, i, user._id) || isLastMessage(message, i, user._id));
          const isLast = isLastMessage(message, i, user._id);
          const showDateDivider = i === 0 || !isSameDay(message[i - 1].createdAt, m.createdAt);

          return (
            <React.Fragment key={m._id}>
              {showDateDivider && (
                <Flex align="center" my="6">
                  <Box flex="1" h="1px" bg="whiteAlpha.100" />
                  <Text mx="4" fontSize="10px" fontWeight="bold" color="whiteAlpha.400" letterSpacing="widest" textTransform="uppercase">
                    {new Date(m.createdAt).toDateString() === new Date().toDateString() ? "Today" : new Date(m.createdAt).toLocaleDateString()}
                  </Text>
                  <Box flex="1" h="1px" bg="whiteAlpha.100" />
                </Flex>
              )}

              <Box
                display="flex"
                alignItems="flex-end"
                mb={isSameSender(message, m, i, user._id) ? "3px" : "12px"}
                flexDir={isMe ? 'row-reverse' : 'row'}
                px="1"
              >
                {!isMe && (
                  showAvatar ? (
                    <Tooltip label={m.sender.name} placement="bottom-start" hasArrow bg="gray.700">
                      <Avatar
                        size="xs"
                        name={m.sender.name}
                        src={m.sender.pic}
                        mb="2px"
                        mr="8px"
                        borderRadius="8px"
                        bg="rgba(255,255,255,0.1)"
                      />
                    </Tooltip>
                  ) : (
                    <Box w="28px" mr="8px" />
                  )
                )}

                <Box display="flex" alignItems="center" gap="1" flexDir={isMe ? 'row-reverse' : 'row'} maxW="75%">
                  {isEmoji ? (
                    <Box position="relative" px="1" py="1">
                       <Box fontSize="40px" lineHeight="1">{m.content}</Box>
                       <Text fontSize="9px" color="whiteAlpha.400" position="absolute" bottom="-12px" right="0">
                         {formatTime(m.createdAt)}
                       </Text>
                    </Box>
                  ) : (
                    <Box
                      bg={isMe ? "linear-gradient(135deg, #2563eb, #1e40af)" : "rgba(255,255,255,0.08)"}
                      border={isMe ? "none" : "1px solid rgba(255,255,255,0.06)"}
                      color="white"
                      borderRadius={isMe
                        ? (isLast ? "18px 18px 4px 18px" : "18px")
                        : (isLast ? "18px 18px 18px 4px" : "18px")
                      }
                      px={m.imageUrl ? "4px" : "14px"}
                      py={m.imageUrl ? "4px" : "9px"}
                      fontSize="14px"
                      minW="55px"
                      boxShadow={isMe ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "0 2px 8px rgba(0,0,0,0.15)"}
                      backdropFilter="blur(10px)"
                    >
                      <Flex direction="column" gap="1">
                        {m.imageUrl && (
                          <Image
                            src={m.imageUrl}
                            alt="shared"
                            maxW="100%"
                            maxH="400px"
                            borderRadius="14px"
                            display="block"
                            fallback={<Box w="200px" h="150px" display="flex" alignItems="center" justifyContent="center">Loading photo...</Box>}
                          />
                        )}

                        {/* Image URL Error Check */}
                        {!m.imageUrl && m.content === "Shared a photo" && (
                          <Box p="3" bg="red.900" borderRadius="10px" fontSize="11px" color="whiteAlpha.800">
                             ⚠️ Photo link failed to load
                          </Box>
                        )}
                        
                        {(m.content && (m.content !== "Shared a photo" || !m.imageUrl)) && (
                          <Flex align="flex-end" justify="space-between" gap="3" px={m.imageUrl ? "2" : "0"}>
                            <Text>{m.content}</Text>
                            <Flex align="center" gap="1" flexShrink={0} mb="1px">
                              <Text fontSize="10px" color={isMe ? "whiteAlpha.700" : "whiteAlpha.400"}>
                                {formatTime(m.createdAt)}
                              </Text>
                              {isMe && (
                                <Box opacity="0.8">
                                  {m.readBy?.length > 1 ? <IoCheckmarkDoneSharp color="#93c5fd" size="14px" /> : <IoCheckmarkSharp size="14px" />}
                                </Box>
                              )}
                            </Flex>
                          </Flex>
                        )}

                        {/* Time/Status for image-only messages */}
                        {isMe && m.imageUrl && (m.content === "Shared a photo" || !m.content) && (
                          <Box position="absolute" bottom="8px" right="8px" bg="blackAlpha.700" borderRadius="full" px="2" py="0.5" backdropFilter="blur(4px)" display="flex" alignItems="center" gap="1">
                             <Text fontSize="9px" color="whiteAlpha.800">{formatTime(m.createdAt)}</Text>
                             {m.readBy?.length > 1 ? <IoCheckmarkDoneSharp color="#93c5fd" size="11px" /> : <IoCheckmarkSharp color="white" size="11px" />}
                          </Box>
                        )}
                        {!isMe && m.imageUrl && (m.content === "Shared a photo" || !m.content) && (
                          <Box position="absolute" bottom="8px" right="8px" bg="blackAlpha.600" borderRadius="full" px="2" py="0.5" backdropFilter="blur(4px)">
                             <Text fontSize="9px" color="whiteAlpha.800">{formatTime(m.createdAt)}</Text>
                          </Box>
                        )}
                      </Flex>
                    </Box>
                  )}

                  {isMe && !m.imageUrl && (
                    <Menu isLazy>
                      <MenuButton as={Box} cursor="pointer" opacity="0.2" _hover={{ opacity: 1 }} p="1" transition="0.2s">
                        <BsThreeDotsVertical size="11" />
                      </MenuButton>
                      <MenuList bg="#1C1C1E" border="1px solid rgba(255,255,255,0.1)" p="1" minW="100px">
                        <MenuItem bg="transparent" _hover={{ bg: "whiteAlpha.100" }} borderRadius="8px" onClick={() => handleEditOpen(m)}>✏️ Edit</MenuItem>
                        <MenuItem bg="transparent" _hover={{ bg: "red.900" }} borderRadius="8px" onClick={() => onDelete(m._id)} color="red.400">🗑️ Delete</MenuItem>
                      </MenuList>
                    </Menu>
                  )}
                </Box>
              </Box>
            </React.Fragment>
          );
        })}
      </ScrollableFeed>

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(12px)" />
        <ModalContent bg="#1C1C1E" color="white" borderRadius="20px" border="1px solid rgba(255,255,255,0.1)">
          <ModalHeader borderBottomWidth="1px" borderColor="whiteAlpha.100">Edit Message</ModalHeader>
          <ModalCloseButton />
          <ModalBody py="6">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit..."
              bg="whiteAlpha.100"
              border="none"
              borderRadius="12px"
              _focus={{ boxShadow: "0 0 0 2px rgba(37,99,235,0.5)" }}
            />
          </ModalBody>
          <ModalFooter gap="3">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button bg="blue.600" color="white" _hover={{ bg: "blue.500" }} onClick={handleEditSubmit} borderRadius="12px" px="8">Update</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ScrollChat;
