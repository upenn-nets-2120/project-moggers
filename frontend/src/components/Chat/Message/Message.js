import "./Message.css"
import React, { useState, useEffect } from 'react'
import config from '../../../serverConfig.json';
import axios from "axios";


// sender is 0 if self, 1 if system, and 2 if other
// still need to add a variable holdibng the actual text
export default function Message({msgContents, currUser}) {
    const [profilePic, setProfilePic] = useState('https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png');

    useEffect(() => {
        const fetchProfilePic = async () => {
            try {
                const response = await axios.get(`${config.serverRootURL}/getProfile`, {
                    params: { user_id: currUser }
                });
                if (response.data.data1 && response.data.data1[0].profilePhoto !== null) {
                    setProfilePic(response.data.data1[0].profilePhoto);
                }
            } catch (error) {
                console.error('Error fetching profile pic:', error);
            }
        };
        fetchProfilePic();
    });

    var sender = msgContents.author;    
    const contents = msgContents.content;
    const timestamp = msgContents.timestamp;
    let messageClass;
    if (currUser === sender) {
        messageClass = 'message own';
    } else if (sender === -1) {
        messageClass = 'message system';
    } else {
        messageClass = 'message';
    }
  
   
    console.log(messageClass);

    return (
        <div className={messageClass}>
            <div className="messageTop">
                <img className='messageImg' src={profilePic} alt='pfp'/>
                <p className='messageText'>
                    {contents}
                </p>
            </div>
            <div className="messageBottom">{timestamp}</div>
        </div>
    )
}