import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Conversation from "./Conversations/Conversations.js";
import Message from "./Message/Message.js";



const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [id, setId] = useState(Math.random());
    const [room, setRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('chat message', (msg) => {
                setMessages((prevMessages) => [...prevMessages, msg]);
            });
        }
    }, [socket]);

    const sendChat = () => {
        if (inputValue.trim() !== '') {
            socket.emit('chat message', {
                text: inputValue.trim(),
                sender: id,
                room: 1
            });

            setInputValue('');
        }
    };

    const handleRoomButtonClick = () => {
        if (!room) {
            axios.post('/join', { room: 1 })
                .then((response) => {
                    if (response.data.success) {
                        setRoom(true);
                        socket.emit('join room', { sender: id, room: 1 });
                    }
                })
                .catch((error) => {
                    console.error('Error joining room:', error);
                });
        } else {
            axios.post('/leave', { room: 1 })
                .then((response) => {
                    if (response.data.success) {
                        setRoom(false);
                        socket.emit('leave room', { sender: id, room: 1 });
                    }
                })
                .catch((error) => {
                    console.error('Error leaving room:', error);
                });
        }
    };

    return (
        <>
            {/* <div className="left">
                <div className="wrapper">
                    <h1 className="fadeIn zeroth"><span>Start chatting!</span></h1>
                    <div className="fadeIn second" id="buttons-wrapper">
                        <h2 id="roomBtn" className="underlineHover" onClick={handleRoomButtonClick}>
                            {room ? 'Leave chat room' : 'Enter chat room'}
                        </h2>
                    </div>
                </div>
            </div> */}



            <div className="chat">
                <div className="chatMenu">
                    <div className="chatMenuWrapper">
                        <input placeholder="Search friend" className="chatMenuInput"/>
                        <Conversation/>
                        <Conversation/>
                        <Conversation/>
                        <Conversation/>
                    </div>
                </div>
                <div className="chatBox">
                    <div className="chatBoxWrapper">
                        <div className='chatBoxTop'>
                            <Message />
                            <Message own={true}/>
                            <Message />
                            <Message />
                            <Message />
                            <Message />
                            <Message />
                        </div>
                        <div className='chatBoxBottom'>
                            <textarea className='chatMessageInput' placeholder="Enter a message..."></textarea>
                            <button className='chatSubmitButton'>Send</button>
                        </div>
                    </div>
                </div>
                {/* <div className="chatOnline">
                    <div className="chatMenuWrapper">
                        online
                    </div>
                </div> */}
            </div>

            {/* <div className="chat">
                <div>
                    <ul id="messages">
                        {messages.map((msg, index) => (
                            <li key={index} className={id === msg.sender ? 'me' : 'other'}>
                                {msg.text}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ height: '20px' }}></div>
                <form id="message-form">
                    <div id="form-message">
                        <input
                            className="form-control"
                            id="input"
                            autoComplete="off"
                            placeholder="Enter your message..."
                            onFocus={() => setInputValue('')}
                            onBlur={() => setInputValue('Enter your message...')}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button type="button" id="send_btn" className="btn btn-light" onClick={sendChat}>
                            Send
                        </button>
                    </div>
                </form>
            </div> */}
        </>
    );
};

export default Chat;
