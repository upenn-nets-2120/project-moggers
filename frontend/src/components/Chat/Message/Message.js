import "./Message.css"
import React from 'react'


// sender is 0 if self, 1 if system, and 2 if other
// still need to add a variable holdibng the actual text
export default function Message({msgContents, currUser}) {
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
                <img className='messageImg' src='/nets2120/project-moggers/crguy.jpg' alt=''/>
                <p className='messageText'>
                    {contents}
                </p>
            </div>
            <div className="messageBottom">{timestamp}</div>
        </div>
    )
}