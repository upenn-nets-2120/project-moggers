import "./chat.css"
import axios from 'axios';
import {io} from 'socket.io-client';
import config from '../../serverConfig.json';
import React, { useState, useEffect, useRef } from 'react';
import Conversation from "./Conversations/Conversations.js";
import Message from "./Message/Message.js";
import ReactSession from "../../ReactSession.js";
import Invite from "./Invites/Invite.js";

const Chat = () => {
    const rootURL = config.serverRootURL;
    const socket = useRef();
    var currUserId = ReactSession.get("user_id");
    var currUsername = ReactSession.get("username");

    const [conversations, setConversations] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatMenuInputClass, setChatMenuInputClass] = useState('chatMenuInput');
    const [newFriendChatInvite, setNewFriendChatInvite] = useState("");
    const [inputPlaceholder, setInputPlaceholder] = useState("Search a friend username to invite for a new chat session");
    const [numInvites, setNumInvites] = useState(0);
    const [invites, setInvites] = useState([]);
    const [oldChatId, setOldChatId] = useState(null);  
    const [inviteUsername, setInviteUsername] = useState(""); 
    const [chatInvClass, setChatInvClass] = useState("chatMenuInput")
    const [inputPlaceholder2, setInputPlaceholder2] = useState("Enter a user to invite...")
    const [arrivalMsg, setArrivalMsg] = useState(null);
    const [timestamp, setTimestamp] = useState(null);
    const [messageId, setMessageId] = useState(null);
    const [chatProfiles, setChatProfiles] = useState({}); // hashmap of userId : stuff
    
    // will just keep flickering to activate hook
    const [clickedInvite, setClickedInvite] = useState(false);
    const [sendMessageDummy, setSendMessageDummy] = useState(false);
    const [convoMapDummy, setConvoMapDummy] = useState(false);
    const [incomingMessage, setIncomingMessage] = useState(false);




    const chatBoxRef = useRef(null);

    // used to scroll to bottom of messages
    useEffect(() => {
        if (chatBoxRef.current) {
            // Scroll to the bottom of the chat box
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);

    // connects to socket and receives chat messages
    useEffect(() => {
        try {
            socket.current = io('http://localhost:8080');
            socket.current.on("chat message", obj => {                
                // change in order to call the hook
                setIncomingMessage(!incomingMessage);
                setArrivalMsg({
                    message_id: obj.message_id,
                    content : obj.content,
                    author: obj.author,
                    timestamp: obj.timestamp,
                    room : obj.room
                });
            })

            console.log('Socket connection established successfully.');
        } catch (error) {
            console.error('Error establishing socket connection:', error);
        }
    }, []);
    
    useEffect(() => {
        if (arrivalMsg) {
            setMessages((prev) => [...prev, arrivalMsg]);
        }
    }, [arrivalMsg])

    
    // loads all the conversations for a user
    useEffect(() => {
        const getConversations = async () => {
            try {
                const res = await axios.post(`${rootURL}/getConvos`, {user_id: currUserId});
                // NEED TO GET REQUEST TO FIND NUMBER OF INVITES and use setNUMINVITES//////////////////////////////////////////////////////
                // const res2 = await axios.get(`${rootURL}/getNumInvites`, {user_id : currUserId});

                setConversations(res.data.data);
                // setNumInvites(res.data.data);
            } catch (error) {
                console.log(error);
            }
            
        }
        getConversations();
    }, [currUserId, clickedInvite])

    const getProfiles = async (chatId) => {
        try {
            const res = await axios.get(`${rootURL}/getProfilesInChat`, { params: { chatId: chatId } });
            const promises = res.data.data.map(async (item) => {
                const response = await axios.get(`${rootURL}/getProfile`, {
                    params: { user_id: item.user_id }
                });
                return [item.user_id, response.data.data1[0]]; // Assuming you want to return the data from the response
            });
            const profiles = await Promise.all(promises);
            var profiles_mapping = {};
            await profiles.forEach(item => {
                profiles_mapping[item[0]] = item[1];
            })
            setChatProfiles(profiles_mapping);
        } catch (error) {
            console.log(error);
        }
    } 

    async function loadMsgs(chatId) {
        try {
            const res = await axios.get(`${rootURL}/getMessages`, { params: { chatId: chatId } });
            setMessages(res.data.data);
        } catch (error) {
            console.log(error);
        }  
    }

    // When the text box of invite input changes
    const handleInviteTextChange = (event) => {
        setInputPlaceholder("Search a friend username to invite for a new chat session");
        setNewFriendChatInvite(event.target.value);
        setChatMenuInputClass("chatMenuInput");
    };

    const handleInviteUsernameChange = (event) => {
        setInputPlaceholder2("Enter a user to invite...");
        setInviteUsername(event.target.value);
        setChatInvClass("chatMenuInput");
    }

    // When you click the send message button
    const sendMessage = () => {
        const send = async () => {
            if (newMessage.length === 0) {
                console.log("Trying to send an empty message");
            } else if (!currentChatId) {
                console.log("Currently not in a chat");
            } else {
                console.log('Trying to send message:', newMessage);
                try {
                    const res = await axios.post(`${rootURL}/postMessage`, {author: currUserId, content:newMessage, chat_id: currentChatId});
                    setMessageId(res.data.message_id);
                    setTimestamp(res.data.timestamp);
                    setSendMessageDummy(!sendMessageDummy);
                } catch (error) {
                    console.log(error);
                }
            }
        }
        send();
    };
    
    // Called when a message is sent by button by sendMessage
    useEffect(() => {
        socket.current.emit("chat message", {
            message_id: messageId,
            content : newMessage,
            author: currUserId,
            timestamp: timestamp,
            room : currentChatId
        });
        setNewMessage("");
    }, [sendMessageDummy])

    // Called when button to send new invite is pressed
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
                    const res9 = await axios.get(`${rootURL}/getUserName`, { params: { username: newFriendChatInvite } });

                    const friend_id = res9.data.data.id;
                    
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
                    if (!friend_status) {
                        setInputPlaceholder("Friend is not online currently, try again later.");
                        setChatMenuInputClass("chatMenuInputError");
                        setNewFriendChatInvite("");
                        return;
                    }
                
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
                    sendNewChatReq(currUserId, friend_id, -1);
                }
            } catch (error) {
                console.log(error);
            }            
        }
        helper();
    };

    const handleNewInviteMore = () => {
        const helper = async () => {
            try {
                if (inviteUsername === currUsername) {
                    setInputPlaceholder2("You can't chat with yourself.");
                    setChatInvClass("chatMenuInputError");
                    setInviteUsername("");

    
                } else {
                    // first see if the person is online or not.
                    // get id of inviteUsername
                    const res9 = await axios.get(`${rootURL}/getUserName`, { params: { username: inviteUsername } });
                    const friend_id = res9.data.data.id;
                    
                    if (friend_id === -1) {
                        // could not friend's id
                        setInputPlaceholder2("Could not find friend. Type exact username.");
                        setChatInvClass("chatMenuInputError");
                        setInviteUsername("");
                        return;
                    }

                    // then get status of id and if they are offline then don't make
                    const res1 = await axios.get(`${rootURL}/getStatus`, { params: { user_id: friend_id } });
                    
                    const friend_status = res1.data.data[0].status;
                    if (!friend_status) {
                        setInputPlaceholder2("Friend is not online currently, try again later.");
                        setChatInvClass("chatMenuInputError");
                        setInviteUsername("");
                        return;
                    }

                    // otherwise check if they are already in the chat rn
                    const res2 = await axios.get(`${rootURL}/alreadyInChat`, { params: { userId: friend_id , chatId: currentChatId} });
                    if (res2.data.status) {
                        // they are already in the chat
                        setInputPlaceholder2("This person is already here.");
                        setChatInvClass("chatMenuInputError");
                        setInviteUsername("");
                        return;
                    }

                    // check if you already sent a chat req with this person
                    const res3 = await axios.get(`${rootURL}/alreadySent`, { params: { user_id1: currUserId , user_id2: friend_id} });
                    const already_sent = res3.data.status;
                    if (already_sent) {
                        setInputPlaceholder2("You sent an invite to this person.");
                        setChatInvClass("chatMenuInputError");
                        setInviteUsername("");
                        return;
                    }

                    // otherwise just send a chat req
                    sendNewChatReq(currUserId, friend_id, currentChatId);
                    console.log("sent chat request");
                }
            } catch (error) {
                console.log(error);
            }            
        }
        helper();
    };


    const handleLeave = async () => {
        const res = await axios.post(`${rootURL}/postMessage`, {author: 9, content:`User ${currUserId} has left`, chat_id: currentChatId});
        const leaveHelper = async () => {
            const res1 = await axios.post(`${rootURL}/leaveChat`, { userId: currUserId, chatId: currentChatId });
        };
        await leaveHelper();
        setCurrentChatId(null);
        setClickedInvite(!clickedInvite);
    }

    // Helper to handleNewInvite to actually send the request
    function sendNewChatReq(userId, friendId, senderChatId) {
        const sendChatRequest = async () => {
            const res = await axios.post(`${rootURL}/sendChatRequest`, { sender: userId, receiver: friendId, origin: senderChatId });

            if (res.data.message == "Your friend already sent you a request, please accept.") {
                setInputPlaceholder("Your friend already sent the request, please accept.");
                setChatMenuInputClass("chatMenuInputError");
                setNewFriendChatInvite("");
                //////////////////////////// DO STUFF///////////////////////////////////////////////////////////////////////
                return;
            }
        };
        sendChatRequest();
    }

    // Called when you click on a convo
    async function handleSelectChat(chatId) {
        setCurrentChatId(chatId);
        await getProfiles(chatId);
        setConvoMapDummy(!convoMapDummy);
        await loadMsgs(chatId);
    }

    // Used to enter a socket room when you click on a convo. Helper for above
    useEffect(() => {
        function dummy2() {
            setCurrentChatId(currentChatId);
            // const rooms = Object.keys(socket.current.rooms); // Get an array of room names
            // const isInRoom = rooms.length > 1; // If the socket is in any room other than its own room
   
            socket.current.emit("leave room", {
                room : oldChatId
            })
            if (currentChatId) {
                socket.current.emit("join room", {
                    room : currentChatId
                });
                setOldChatId(currentChatId);
            }
        }
        dummy2();
    }, [convoMapDummy])
    
    // When you click on an invite anywhere calls below
    function handleClickInvite() {
        setClickedInvite(!clickedInvite);
    }
    
    // Called during handleClickInvite
    useEffect (() => {
        // re get the invites and put into setInvites
        
        getInvites();
    }, [clickedInvite])
    const getInvites = async () => {
        try {
            const res = await axios.get(`${rootURL}/getInvites`, { params: { userId: currUserId } });
            setInvites(res.data.data);
        } catch (error) {
            console.log(error);
        }
    }

    async function handleAcceptInvite(senderId, receiverId,senderChatId) {
        // send accept Chat invite request and rerender
        try {
            const acceptInvite = async () => {
                const res = await axios.post(`${rootURL}/acceptChatRequest`, { sender: senderId, receiver: receiverId , origin: senderChatId});
            };
            await acceptInvite();
            const res = await axios.post(`${rootURL}/postMessage`, {author: 9, content:`User ${currUserId} has joined the chat`, chat_id: currentChatId});
            await setClickedInvite(!clickedInvite);
        } catch (error) {
            console.log(error);
        }
        getInvites();
    }

    function handleDeclineInvite(senderId, receiverId, senderChatId) {
        try {
            const declineInvite = async () => {
                await axios.post(`${rootURL}/declineChatInvite`, { sender: senderId, receiver: receiverId , senderChatId: senderChatId});
            };
            declineInvite();
            setClickedInvite(!clickedInvite);
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="chat">
            <div className="chatMenu">
                <div className="chatInviteBar">
                    {invites.map(inv => (
                        <div className = "inviteEntry">
                            <img className="inviteImage" src='https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png' alt=''/>
                            <div className="inviteInfo">
                                <span>{inv.sender} has invited you to chat</span>
                            </div>
                            <div className="inviteActions">
                                <button className="acceptButton" onClick={()=>handleAcceptInvite(inv.sender, inv.receiver, inv.origin)}>Accept</button>
                                <button className="declineButton" onClick={()=>handleDeclineInvite(inv.sender, inv.receiver, inv.senderChatId)}>Decline</button>
                            </div>
                        </div>                  
                    ))}
                </div>
                <div className="chatMenuWrapper">
                    <input style={{width: "75%", marginLeft: "10px"}}
                        className={chatMenuInputClass}
                        placeholder={inputPlaceholder}
                        value={newFriendChatInvite}
                        onChange={handleInviteTextChange}
                    />
                    <button className="newChatButton" onClick={handleNewInvite}>Create Chat</button>
                </div>
                {conversations.map(convo => (
                    <div key={convo.chat_id} onClick={() => handleSelectChat(convo.chat_id)}>
                        <Conversation conversation={convo} />
                    </div>
                ))}
            </div>
            <div className="chatBox">
                <div className="chatBoxWrapper">
                    {currentChatId ? (
                        <>  
                            <div className = "ChatBoxBar" >
                                <input
                                    className={chatInvClass}
                                    placeholder={inputPlaceholder2}
                                    value={inviteUsername}
                                    onChange={handleInviteUsernameChange}
                                />
                                <button className="inviteButton" onClick={handleNewInviteMore}>Invite</button>
                                <button className="leaveButton" onClick={handleLeave}>Leave</button>
                            </div>
                            <div className="chatBoxTop" ref={chatBoxRef}>
                                {messages.map(msg => (
                                    <div key={msg.message_id}>
                                        <Message msgContents={msg} currUser={currUserId} chatProfiles={chatProfiles}/>
                                    </div>
                                ))}
                            </div>
                            <div className="chatBoxBottom">
                                <textarea
                                    className="chatMessageInput"
                                    placeholder="Enter a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
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
