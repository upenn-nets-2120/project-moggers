import "./chat.css"
import config from '/nets2120/project-moggers/frontend/src/serverConfig.json';
import axios from 'axios';
import io from 'socket.io-client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

import Conversation from "./Conversations/Conversations.js";
import Message from "./Message/Message.js";



const Chat = () => {
    ////////////////////////////////////////////////////////////////// OLD STUFF////////////
    const [socket, setSocket] = useState(null);
    const [id, setId] = useState(Math.random());
    const [room, setRoom] = useState(false);
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

        ////////////////////////////////////////////////////////////////// OLD STUFF////////////







    const rootURL = config.serverRootURL;
    // const {user} = useContext(); // CHANGE HERE TO GET USER/////////////////
    const user  = {
        id: 9999
    }

    // assumes a field called id

    /////////////////////////////////////////
    const [currUserId, setCurrUserId] = useState(2);
    const [currUsername, setCurrUsername] = useState(mts);
    const [conversations, setConversations] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const setCurrUser = async () => {
            try {
                const res = await axios.get(`${rootURL}/`);
                const user_id = res.user_id;
                const username = res.username;
                setCurrUserId(user_id);
                setCurrUsername(username);
            } catch (error) {
                console.log(error);
            }
        }
        setCurrUser();
    }, [])
    
    useEffect(() => {
        const getConversations = async () => {
            try {
                const requestBody = {
                    body: {
                        user_id: currUserId
                    }
                  };
                const res = await axios.get(`${rootURL}/getConvos`, requestBody);
                setConversations(res.data);
            } catch (error) {
                console.log(error);
            }
            
        }
        getConversations();
    }, [currUserId])

    useEffect(() => {
        const getMsgs = async () => {
            try {
                const requestBody = {
                    body: {
                        chatId: currentChatId
                    }
                };
                const res = await axios.get(`${rootURL}/getMessages`, requestBody);
                setMessages(res.data);
            } catch (error) {
                console.log(error);
            }
            
        } 
        getMsgs();
    }, [currentChatId])

    return (
        <>
            <div className="chat">
                <div className="chatMenu">
                    <div className="chatMenuWrapper">
                        <input placeholder="Search friend" className="chatMenuInput"/>
                        {conversations.map(convo => (
                            <div onCLick={() => setCurrentChatId(convo)}>
                                <Conversation conversation={convo}/>
                            </div>
                        ))}
                        {/* DUMMY STUFF
                        <Conversation/>
                        <Conversation/>
                        <Conversation/>
                        <Conversation/> */}
                    </div>
                </div>
                <div className="chatBox">
                    <div className="chatBoxWrapper">
                        {currentChatId ? 
                            <>
                                <div className='chatBoxTop'>
                                    {messages.map(msg => (
                                        <div>
                                            <Message conversation={convo}/>
                                        </div>
                                    ))}
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
                            </> : <span className="noCurrentConvoText">
                                Open a previous conversation or start a new one!
                            </span>}
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
