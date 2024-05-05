import "./chat.css"
<<<<<<< HEAD
import config from '/Users/matthewtsui/project-moggers/frontend/src/serverConfig.json';
=======
>>>>>>> 774af5b133c258e7a5c0c130c812c42a37e2a771
import axios from 'axios';
import io from 'socket.io-client';
import config from '../../serverConfig.json';

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
    const [currUsername, setCurrUsername] = useState("mts");
    const [conversations, setConversations] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const setCurrUser = async () => {
            try {
                const res = await axios.get(`${rootURL}/`);
                console.log("spnogeobob");
                console.log(res);
                const user_id = res.data.user_id;
                const username = res.data.username;
                console.log("hello!");
                console.log(user_id);
                if (user_id !== -1) {
                    console.log("ok!");
                    setCurrUserId(user_id);
                    setCurrUsername(username);
                }
            } catch (error) {
                console.log(error);
            }
        }
        setCurrUser();
    }, [])
    console.log("this is the current user_id");
    console.log(currUserId);
    useEffect(() => {
        const getConversations = async () => {
            try {
                const requestBody = {
                    params: {
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
    console.log(`${rootURL}/getConvos`);

    console.log(currUserId);

    console.log(conversations);
    // turn into a function called by abnove
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
                                    {/* {messages.map(msg => (
                                        <div>
                                            <Message conversation={msg}/>
                                        </div>
                                    ))} */}
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
