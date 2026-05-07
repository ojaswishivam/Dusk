import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const END_POINT = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === "production" ? window.location.origin : "http://localhost:5000");
const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  const [user, setUser] = useState();
  const [selectedChat, setSelectedChat] = useState();
  const [chats, setChats] = useState([]);
  const [notification, setNotification] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    setUser(userInfo);
    if (!userInfo) {
      navigate("/");
    }
  }, [navigate]);

  // Create socket when user is available
  useEffect(() => {
    if (!user) return;

    const newSocket = io(END_POINT, { transports: ["websocket", "polling"] });

    newSocket.emit("setup", user);

    newSocket.on("connected", () => {
      setSocketConnected(true);
    });

    newSocket.on("online users", (users) => {
      // Normalize all IDs to strings for reliable comparison
      setOnlineUsers(users.map((id) => String(id)));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocketConnected(false);
    };
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        user,
        setUser,
        selectedChat,
        setSelectedChat,
        chats,
        setChats,
        notification,
        setNotification,
        onlineUsers,
        setOnlineUsers,
        socket,
        socketConnected,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;
