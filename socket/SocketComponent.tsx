// src/client/src/SocketComponent.jsx
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

function SocketComponent() {
  const [chatMessages, setChatMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [customResponse, setCustomResponse] = useState('');

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState('');
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const username = 'User1';

  useEffect(() => {
    // Connect to the chat namespace
    const chatSocket = io('http://localhost:5000/chat');
    chatSocket.on('chatMessage', (message) => {
      setChatMessages((prevMessages) => [...prevMessages, message]);
      // or  Fetched messages from Laravel API
    });


    // Listen for typing notifications
    chatSocket.on('typing', (message) => {
      setTypingMessage(message);
    });

    // Listen for stop typing notifications
    chatSocket.on('stopTyping', () => {
      setTypingMessage('');
    });

    // Connect to the notifications namespace
    const notificationsSocket = io('http://localhost:5000/notifications');
    notificationsSocket.on('notify', (notification) => {
      setNotifications((prevNotifications) => [
        ...prevNotifications,
        notification,
      ]);
    });

    // Connect to the general namespace for custom events
    const generalSocket = io('http://localhost:5000');
    generalSocket.on('customResponse', (response) => {
      setCustomResponse(response);
    });

    // Cleanup on component unmount
    return () => {
      chatSocket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      notificationsSocket.disconnect();
      generalSocket.disconnect();
    };
  }, []);

  const sendChatMessage = (message) => {
    const chatSocket = io('http://localhost:5000/chat');
    chatSocket.emit('chatMessage', message);
  };

  const sendNotification = (notification) => {
    const notificationsSocket = io('http://localhost:5000/notifications');
    notificationsSocket.emit('notify', notification);
  };

  const sendCustomEvent = (data) => {
    const generalSocket = io('http://localhost:5000');
    generalSocket.emit('customEvent', data);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    handleTyping();
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit('typing', username);

      // Automatically stop typing notification after a timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit('stopTyping');
      }, 2000);
    } else {
      // If the user continues typing, reset the timeout
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit('stopTyping');
      }, 2000);
    }
  };

  return (
    <div>
      <h2>Socket.IO Manager</h2>
      <div>
        <h3>Chat Messages</h3>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type a message"
        />
        <p>{typingMessage}</p>
        <ul>
          {chatMessages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
        <button onClick={() => sendChatMessage('Hello from chat')}>Send Chat Message</button>
      </div>
      <div>
        <h3>Notifications</h3>
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>{notification}</li>
          ))}
        </ul>
        <button onClick={() => sendNotification('New Notification!')}>Send Notification</button>
      </div>
      <div>
        <h3>Custom Events</h3>
        <p>{customResponse}</p>
        <button onClick={() => sendCustomEvent('Hello from custom event')}>
          Send Custom Event
        </button>
      </div>
    </div>
  );
}

export default SocketComponent;
