import "./Invite.css"
import React, { useState, useEffect } from 'react'
import config from '../../../serverConfig.json';
import axios from "axios";


// sender is 0 if self, 1 if system, and 2 if other
// still need to add a variable holdibng the actual text
export default function Invite({senderId, receiverId}) {
    const [profilePic, setProfilePic] = useState('https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png');
    const [name, setName] = useState('');

    // first get the username of the sender_id
    useEffect(() => {
        const getUsername = async () => {
            try {
                console.log(senderId);
                console.log("okkkkkk");
                const username = await axios.get(`${config.serverRootURL}/getIdGivenUsername`, {
                    params: {
                      user_id: senderId
                    }
                  });
              
                setName(username.data.data.username);
            } catch (error) {
                console.log(error);
            }   
        }
        getUsername();
    }, [])

    function handleAcceptInvite() {
        // send accept Chat invite request and rerender
        try {
            const acceptInvite = async () => {
                console.log(senderId);
                console.log(receiverId);
                console.log('okkkk');
                const res = await axios.post(`${config.serverRootURL}/acceptChatRequest`, { sender: senderId, receiver: receiverId });
            };
            acceptInvite();
        } catch (error) {
            console.log(error);
        }
    }

    function handleDeclineInvite() {
        try {
            const declineInvite = async () => {
                const res = await axios.post(`${config.serverRootURL}/declineChatInvite`, { sender: senderId, receiver: receiverId });
            };
            declineInvite();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="InviteBar">
            <img className="inviteImage" src={profilePic} alt=''/>
            <div className="inviteInfo">
                <span>{name} has invited you to chat</span>
            </div>
            <div className="inviteActions">
                <button className="acceptButton" onClick={handleAcceptInvite}>Accept</button>
                <button className="declineButton" onClick={handleDeclineInvite}>Decline</button>
            </div>
        </div>
    )
}