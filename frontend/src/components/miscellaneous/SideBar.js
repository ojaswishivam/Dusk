import React from 'react'
import { Avatar, Box, Flex, Tooltip, Menu, MenuButton, MenuList, MenuItem, MenuDivider } from '@chakra-ui/react'
import { IoChatbubbleSharp, IoSearchSharp, IoSettingsSharp } from "react-icons/io5"
import { ChatState } from '../../Context/ChatProvider'
import { useNavigate } from 'react-router-dom'
import ProfileModal from './ProfileModal'

const ICON_COLOR = "rgba(255,255,255,0.45)"
const ICON_HOVER = "rgba(255,255,255,0.85)"
const ICON_ACTIVE_BG = "rgba(255,255,255,0.08)"

const SideBar = ({ onSearchOpen }) => {
    const { user } = ChatState()
    const navigate = useNavigate()

    const logoutHandler = () => {
        localStorage.removeItem("userInfo")
        navigate("/")
    }

    const NavIcon = ({ icon, label, onClick, active }) => (
        <Tooltip label={label} placement="right" hasArrow bg="gray.700">
            <Box
                onClick={onClick}
                w="40px" h="40px"
                display="flex" alignItems="center" justifyContent="center"
                borderRadius="12px"
                cursor="pointer"
                fontSize="20px"
                color={active ? "white" : ICON_COLOR}
                bg={active ? ICON_ACTIVE_BG : "transparent"}
                transition="all 0.15s"
                _hover={{ bg: ICON_ACTIVE_BG, color: ICON_HOVER }}
            >
                {icon}
            </Box>
        </Tooltip>
    )

    return (
        <Flex
            direction="column"
            w="64px"
            h="100%"
            style={{ background: "rgba(10, 10, 12, 0.85)" }}
            align="center"
            py="5"
            justify="space-between"
            borderRight="1px solid rgba(255,255,255,0.05)"
            flexShrink={0}
        >
            {/* Top Section */}
            <Flex direction="column" align="center" gap="5">
                {/* Logo mark */}
                <Box
                    w="36px" h="36px" borderRadius="10px"
                    bg="linear-gradient(135deg, #2563eb, #7c3aed)"
                    display="flex" alignItems="center" justifyContent="center"
                    fontSize="16px" fontWeight="bold" color="white"
                    mb="2" boxShadow="0 4px 12px rgba(37, 99, 235, 0.4)"
                    cursor="default" fontFamily="Inter"
                >
                    C
                </Box>

                <NavIcon icon={<IoChatbubbleSharp />} label="Chats" active />
                <NavIcon icon={<IoSearchSharp />} label="Search Users" onClick={onSearchOpen} />
            </Flex>

            {/* Bottom Section */}
            <Flex direction="column" align="center" gap="3">
                <NavIcon icon={<IoSettingsSharp />} label="Settings" />

                {/* Profile Avatar */}
                <Menu placement="right">
                    <MenuButton>
                        <Tooltip label={user.name} placement="right" hasArrow bg="gray.700">
                            <Avatar
                                size="sm"
                                name={user.name}
                                src={user.pic}
                                cursor="pointer"
                                borderRadius="10px"
                                border="2px solid rgba(255,255,255,0.12)"
                                _hover={{ borderColor: "blue.400" }}
                                transition="0.2s"
                            />
                        </Tooltip>
                    </MenuButton>
                    <MenuList bg="#1C1C1E" border="1px solid rgba(255,255,255,0.1)" color="white" borderRadius="xl" shadow="2xl">
                        <ProfileModal user={user}>
                            <MenuItem bg="transparent" _hover={{ bg: "rgba(255,255,255,0.06)" }} borderRadius="lg">
                                My Profile
                            </MenuItem>
                        </ProfileModal>
                        <MenuDivider borderColor="rgba(255,255,255,0.08)" />
                        <MenuItem
                            bg="transparent"
                            _hover={{ bg: "rgba(255,255,255,0.06)" }}
                            borderRadius="lg"
                            color="red.400"
                            onClick={logoutHandler}
                        >
                            Logout
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Flex>
        </Flex>
    )
}

export default SideBar
