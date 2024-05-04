import "./Message.css"
import React from 'react'


export default function Message({own}) {


    return (
        <div className={own ? 'message own' : 'message'}>
            <div className="messageTop">
                <img className='messageImg' src='/nets2120/project-moggers/crguy.jpg' alt=''/>
                <p className='messageText'>
                    Hello, this is a temporary message
                </p>
            </div>
            <div className="messageBottom">Timestamp ago</div>
        </div>
    )
}