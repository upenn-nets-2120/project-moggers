import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [room, setRoom] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const socket = io();

    useEffect(() => {
        socket.on('chat message', (msg) => {
            setMessages(prevMessages => [...prevMessages, msg]);
        });
    }, [socket]);

    const sendChat = () => {
        if (inputValue.trim() !== '') {
            socket.emit('chat message', {
                text: inputValue.trim(),
                sender: Math.random(),
                room: 1
            });
            setInputValue('');
        }
    };

    const toggleRoom = () => {
        if (!room) {
            axios.post('/join', { room: 1 })
                .then(response => {
                    if (response.data.success) {
                        setRoom(true);
                        socket.emit('join room', { sender: Math.random(), room: 1 });
                    }
                })
                .catch(error => {
                    console.error('Error joining room:', error);
                });
        } else {
            axios.post('/leave', { room: 1 })
                .then(response => {
                    if (response.data.success) {
                        setRoom(false);
                        socket.emit('leave room', { sender: Math.random(), room: 1 });
                    }
                })
                .catch(error => {
                    console.error('Error leaving room:', error);
                });
        }
    };

    return (
        <div>
            <div className="left">
                <div className="wrapper">
                    <h1 className="fadeIn zeroth"><span>Start chatting!</span></h1>
                    <div className="fadeIn second" id="buttons-wrapper">
                        <button id="roomBtn" className="underlineHover" onClick={toggleRoom}>
                            {room ? "Leave" : "Enter chat room"}
                        </button>
                    </div>
                </div>
            </div>
            <div class="chat">
                <div>
                    <ul>
                        <li>hi</li>
                        <li>hello</li>
                        <li>how are you</li>
                        {/* {messages.map((msg, index) => (
                            <li key={index} className={msg.sender === id ? "me" : "other"}>
                                {msg.text}
                            </li>
                        ))} */}
                    </ul>
                </div>

                <form>
                    <div>
                        <input
                            className="form-control"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Enter your message..."
                            autoComplete="off"
                        />
                        <button type="button" className="btn btn-light" onClick={sendChat}>
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat;
