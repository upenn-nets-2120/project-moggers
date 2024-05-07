import "./chat.css"
import axios from 'axios';
import io from 'socket.io-client';
import config from '../../serverConfig.json';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

import Conversation from "./Conversations/Conversations.js";
import Message from "./Message/Message.js";
import ReactSession from "../../ReactSession.js";



const Chat = () => {
    ////////////////////////////////////////////////////////////////// OLD STUFF////////////
    // const [socket, setSocket] = useState(null);
    // const [id, setId] = useState(Math.random());
    // const [room, setRoom] = useState(false);
    // const [inputValue, setInputValue] = useState('');

    // useEffect(() => {
    //     const newSocket = io();
    //     setSocket(newSocket);

    //     return () => {
    //         newSocket.disconnect();
    //     };
    // }, []);

    // useEffect(() => {
    //     if (socket) {
    //         socket.on('chat message', (msg) => {
    //             setMessages((prevMessages) => [...prevMessages, msg]);
    //         });
    //     }
    // }, [socket]);

    // const sendChat = () => {
    //     if (inputValue.trim() !== '') {
    //         socket.emit('chat message', {
    //             text: inputValue.trim(),
    //             sender: id,
    //             room: 1
    //         });

    //         setInputValue('');
    //     }
    // };

    // const handleRoomButtonClick = () => {
    //     if (!room) {
    //         axios.post('/join', { room: 1 })
    //             .then((response) => {
    //                 if (response.data.success) {
    //                     setRoom(true);
    //                     socket.emit('join room', { sender: id, room: 1 });
    //                 }
    //             })
    //             .catch((error) => {
    //                 console.error('Error joining room:', error);
    //             });
    //     } else {
    //         axios.post('/leave', { room: 1 })
    //             .then((response) => {
    //                 if (response.data.success) {
    //                     setRoom(false);
    //                     socket.emit('leave room', { sender: id, room: 1 });
    //                 }
    //             })
    //             .catch((error) => {
    //                 console.error('Error leaving room:', error);
    //             });
    //     }
    // };

        ////////////////////////////////////////////////////////////////// OLD STUFF////////////

    const rootURL = config.serverRootURL;

    const [currUserId, setCurrUserId] = useState(4);
    const [currUsername, setCurrUsername] = useState("a");
    const [conversations, setConversations] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatMenuInputClass, setChatMenuInputClass] = useState('chatMenuInput');

    const [sentMessage, setSentMessage] = useState(false);
    const [newFriendChatInvite, setNewFriendChatInvite] = useState("");
    const [inputPlaceholder, setInputPlaceholder] = useState("Search a friend username to invite for a new chat session");

    const chatBoxRef = useRef(null);

    useEffect(() => {
        const setCurrUser = async () => {
            try {
                console.log("km3s");                
                // const res = await axios.get(`${rootURL}/`);

                // const user_id = res.data.user_id;
                // const username = res.data.username;
                // console.log(user_id);
                // console.log(username);

                // if (!user_id) {
                //     setCurrUserId(user_id);
                //     setCurrUsername(username);
                // }
                setCurrUserId(ReactSession.get("user_id"));
                setCurrUsername(ReactSession.get("username"));
                console.log(currUserId);
            } catch (error) {
                console.log(error);
            }
        }
        setCurrUser();
    }, [])

    useEffect(() => {
        const getConversations = async () => {
            try {
                console.log(currUserId);
                console.log("spongebob");
                const res = await axios.post(`${rootURL}/getConvos`, {user_id: currUserId});
                console.log(res.data.data);

                setConversations(res.data.data);
            } catch (error) {
                console.log(error);
            }
            
        }
        getConversations();
    }, [currUserId])

    // turn into a function called by abnove
    useEffect(() => {
        const getMsgs = async () => {
            try {
                console.log("kms");
                const res = await axios.get(`${rootURL}/getMessages`, { params: { chatId: currentChatId } });

                setMessages(res.data.data);
                setSentMessage(false);
            } catch (error) {
                console.log(error);
            }
            
        } 
        getMsgs();
    }, [currentChatId, sentMessage])

    useEffect(() => {
        if (chatBoxRef.current) {
            // Scroll to the bottom of the chat box
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    console.log(messages);

    const handleMessageChange = (event) => {
        setNewMessage(event.target.value);
    };

    const handleInviteTextChange = (event) => {
        setInputPlaceholder("Search a friend username to invite for a new chat session");
        setNewFriendChatInvite(event.target.value);
        
        setChatMenuInputClass("chatMenuInput");
    };

    // const sendChat = () => {
    //     if (inputValue.trim() !== '') {
    //         socket.emit('chat message', {
    //             text: inputValue.trim(),
    //             sender: id,
    //             room: 1
    //         });

    //         setInputValue('');
    //     }
    // };

    const sendMessage = () => {
        // Here, you can use the `message` state variable to access the text
        const send = async () => {
            if (newMessage.length === 0) {
                console.log("Trying to send an empty message");
            } else if (!currentChatId) {
                console.log("Currently not in a chat");
            } else {
                console.log('Trying to send message:', newMessage);
                try {
                    const res = await axios.post(`${rootURL}/postMessage`, {author: currUserId, content:newMessage, chat_id: currentChatId});

                    // reset state of message
                    setNewMessage("");
                    setSentMessage(true);
                } catch (error) {
                    console.log(error);
                }
            }
        }
        send();
    };

    const handleNewInvite = () => {
        const helper = async () => {
            try {
                if (newFriendChatInvite === currUsername) {
                    setInputPlaceholder("You can't chat with yourself.");
                    setChatMenuInputClass("chatMenuInputError");
                    setNewFriendChatInvite("");
                } else {
                    // first see if the person is online or not.
                    // get id of newFriendChatInvite
                    const res = await axios.get(`${rootURL}/getUserName`, { params: { username: newFriendChatInvite } });
                    const friend_id = res.data.data.id;

                    if (friend_id === -1) {
                        // could not friend's id
                        setInputPlaceholder("Could not find friend. Type exact username.");
                        setChatMenuInputClass("chatMenuInputError");
                        setNewFriendChatInvite("");
                        return;
                    }

                    // then get status of id and if they are offline then don't make
                    const res1 = await axios.get(`${rootURL}/getStatus`, { params: { user_id: friend_id } });

                    const friend_status = res1.data.data[0].status;
                    console.log(friend_status);
                    if (!friend_status) {
                        setInputPlaceholder("Friend is not online currently, try again later.");
                        setChatMenuInputClass("chatMenuInputError");
                        setNewFriendChatInvite("");
                        return;
                    }
                    console.log("hi!");
                    console.log(currUserId);
                
                    // otherwise check if they are already in a 1 on 1 chat then just change the chatMenuInput placeholder text to "already have convo"
                    const res2 = await axios.get(`${rootURL}/chatAlreadyExists`, { params: { user_id1: currUserId , user_id2: friend_id} });
                    const already_exists = res2.data.status;
                    if (already_exists) {
                        setInputPlaceholder("You already have a chat with this person.");
                        setChatMenuInputClass("chatMenuInputError");
                        setNewFriendChatInvite("");
                        return;
                    }

                    // check if you already sent a chat req with this person
                    const res3 = await axios.get(`${rootURL}/alreadySent`, { params: { user_id1: currUserId , user_id2: friend_id} });
                    const already_sent = res3.data.status;
                    if (already_sent) {
                        setInputPlaceholder("You sent an invite to this person.");
                        setChatMenuInputClass("chatMenuInputError");
                        setNewFriendChatInvite("");
                        return;
                    }

                    // otherwise just send a chat req
                    sendNewChatReq(currUserId, friend_id);
                    console.log("sent chat request");
                }
            } catch (error) {
                console.log(error);
            }            
        }

        helper();
    };


    // final step in handleNewInvite
    function sendNewChatReq(userId, friendId) {

    }

    return (
        <div className="chat">
            <div className="chatMenu">
                <div className="chatMenuWrapper">
                    <input style={{width: "75%", marginLeft: "10px"}}
                        placeholder={inputPlaceholder}
                        className={chatMenuInputClass}
                        value={newFriendChatInvite}
                        onChange={handleInviteTextChange}
                    />
                    <button className="newChatButton" onClick={handleNewInvite}>Create Chat</button>
                </div>
                {conversations.map(convo => (
                    <div key={convo.chat_id} onClick={() => setCurrentChatId(convo.chat_id)}>
                        <Conversation conversation={convo} />
                    </div>
                ))}
            </div>
            <div className="chatBox">
                <div className="chatBoxWrapper">
                    {currentChatId ? (
                        <>
                            <div className="chatBoxTop" ref={chatBoxRef}>
                                {messages.map(msg => (
                                    <div key={msg.message_id}>
                                        <Message msgContents={msg} currUser={currUserId} />
                                    </div>
                                ))}
                            </div>
                            <div className="chatBoxBottom">
                                <textarea
                                    className="chatMessageInput"
                                    placeholder="Enter a message..."
                                    value={newMessage}
                                    onChange={handleMessageChange}
                                />
                                <button className="chatSubmitButton" onClick={sendMessage}>Send</button>
                            </div>
                        </>
                    ) : (
                        <span className="noCurrentConvoText">
                            Open a previous conversation or start a new one!
                        </span>
                    )}
                </div>
            </div>
        </div>
    );    
};

export default Chat;
