import "./Conversations.css"
import { useEffect, useState } from 'react'


export default function Conversation({conversation}) {
    const [chatId, setChatId] = useState(null);
    const [chatName, setchatName] = useState(null);
    const [latestTimestamp, setLatestTimestamp] = useState(null);

    useEffect(() => {
        console.log("this is convo log");
        console.log(conversation);
     
        const chat_id = conversation.chat_id;
        const chat_name = conversation.chat_name;
        const latest_timestamp = conversation.latest_timestamp;
        setChatId(chat_id);
        console.log("kms");
        console.log(chat_id);
        console.log(chat_name);
        setchatName(chat_name);
        setLatestTimestamp(latestTimestamp);
    }, [conversation])

    return (
        <div className="conversation">
            <img className="conversationImg" src='/nets2120/project-moggers/gcicon.jpg' alt=''/>
            <span className='conversationName'>{chatName}</span>
        </div>
    )
}