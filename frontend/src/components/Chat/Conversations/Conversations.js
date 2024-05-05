import "./Conversations.css"
import { useEffect, useState } from 'react'


export default function Conversation({convo}) {
    const [chatId, setChatId] = useState(null);
    const [chatName, setchatName] = useState(null);
    const [latestTimestamp, setLatestTimestamp] = useState(null);

    useEffect(() => {
        const chat_id = convo.chat_id;
        const chat_name = convo.chat_name;
        const latest_timestamp = convo.latest_timestamp;
        setChatId(chat_id);
        setchatName(chatName);
        setLatestTimestamp(latestTimestamp);
    }, [convo])

    return (
        <div className="conversation">
            <img className="conversationImg" src='/nets2120/project-moggers/gcicon.jpg' alt=''/>
            <span className='conversationName'>{chatName}</span>
        </div>
    )
}