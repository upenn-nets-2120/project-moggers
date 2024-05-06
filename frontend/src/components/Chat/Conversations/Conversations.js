import "./Conversations.css"
import { useEffect, useState } from 'react'


export default function Conversation({conversation}) {
    const [chatId, setChatId] = useState(null);
    const [chatName, setchatName] = useState(null);
    const [latestTimestamp, setLatestTimestamp] = useState(null);

    useEffect(() => {
        const chat_id = conversation.chat_id;
        const chat_name = conversation.chat_name;
        const latest_timestamp = conversation.latest_timestamp;
        setChatId(chat_id);
        setchatName(chat_name);
        setLatestTimestamp(latest_timestamp);
    }, [conversation])

    return (
        <div className="conversation">
            <img className="conversationImg" src='/nets2120/project-moggers/gcicon.jpg' alt=''/>
            <span className='conversationName'>{chatName}</span>
        </div>
    )
}