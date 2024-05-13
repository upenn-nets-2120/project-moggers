import "./Message.css"
import React, { useState, useEffect } from 'react'
import config from '../../../serverConfig.json';
import axios from "axios";


// sender is 0 if self, 1 if system, and 2 if other
// still need to add a variable holdibng the actual text
export default function Message({msgContents, currUser, chatProfiles}) {
    var profilePic = 'https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png';
    var name = "User";
    console.log("starting messages");
    console.log(chatProfiles);
    console.log(msgContents);
    console.log(msgContents.author);
    console.log(chatProfiles[msgContents.author]);
    
    if (chatProfiles[msgContents.author] && chatProfiles[msgContents.author].profilePhoto !== null && chatProfiles[msgContents.author].profilePhoto !== "") {
        console.log("made it");
        profilePic = chatProfiles[msgContents.author].profilePhoto;
    }
    if (chatProfiles[msgContents.author] && chatProfiles[msgContents.author].username !== null && chatProfiles[msgContents.author].username !== "undefined") {
        name = chatProfiles[msgContents.author].username;
    }
    // useEffect(() => {
    //     const fetchProfilePic = async () => {
    //         try {
    //             // console.log("author", msgContents.author);
    //             const response = await axios.get(`${config.serverRootURL}/getProfile`, {
    //                 params: { user_id: msgContents.author }
    //             });
    //             if (response.data.data1 && response.data.data1[0].profilePhoto !== null && response.data.data1[0].profilePhoto !== "") {
    //                 setProfilePic(response.data.data1[0].profilePhoto);
    //             }
    //             if (response.data.data1 && response.data.data1[0].firstName !== null && response.data.data1[0].firstName !== "undefined" && response.data.data1[0].lastName !== "undefined") {
    //                 const fullName = response.data.data1[0].firstName + ' ' + response.data.data1[0].lastName;
    //                 setName(fullName);
    //                 // console.log("name", name);
    //             } else if (response.data.data1 && response.data.data1[0].username !== null && response.data.data1[0].username !== "undefined") {
    //                 setName(response.data.data1[0].username);
    //             }
    //         } catch (error) {
    //             console.error('Error fetching profile pic:', error);
    //         }
    //     };
    //     fetchProfilePic();
    // });

    var sender = msgContents.author;    
    const contents = msgContents.content;
    const timestamp = msgContents.timestamp;
    const options = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    const formattedTimestamp = new Date(timestamp).toLocaleString(undefined, options);
 
    let messageClass;
    if (currUser === sender) {
        messageClass = 'message own';
    } else if (sender === 9) {
        messageClass = 'message system';
    } else {
        messageClass = 'message';
    }
  
   
    // console.log(messageClass);

    return (
        <div className={messageClass}>
            <div className="messageTop"> 
                <p className='messageName'>{name}</p>
            </div>
            <div className="messageTop">
                <img className='messageImg' src={profilePic} alt='pfp'/>
                <p className='messageText'>
                    {contents}
                </p>
            </div>
            <div className="messageBottom">{formattedTimestamp}</div>
        </div>
    )
}