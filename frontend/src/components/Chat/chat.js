import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


const Chat = () => {
    var socket = io();
    var id = Math.random();
    var room = false;

    // client sending message
    function sendChat() {
        const new_msg = $('#input').val().trim();
        if (new_msg !== '') {
            socket.emit('chat message', {
                text: new_msg,
                sender: id,
                room: 1
            });
            
            // reset to blank
            $('#input').val('');
            $('#input').focus();
        }
    }

    // client receiving message
    $(document).ready(function() {
        socket.on('chat message', function(msg) {
            // render msg
            var message_temp = document.createElement("li");
            if (id === msg.sender) {
                // msg sent by self
                message_temp.setAttribute("class", "me");
            } else {
                message_temp.setAttribute("class", "other");
            }
            message_temp.appendChild(document.createTextNode(msg.text))
            $('#messages').append(message_temp);
            $('#messages').animate({
                scrollTop: $('#messages').get(0).scrollHeight
            }, 0);
        })
    });
    
    // handling chat button
    $("#roomBtn").on("click", function () {
        // if not in a room rn
        if (!room) {
            $.post('/join', { room: 1}, function(data) {
                if (data.success) {
                    room = true;
                    socket.emit('join room', {
                        sender: id,
                        room: 1
                    });
                    $(".left").removeClass("fullWidth");
                    $(".chat").show();
                    $("#roomBtn").html("Leave");
                }
            });
        } else {
            $.post('/leave', {room:1}, function(data){
                if (data.success) {
                    room = false;
                    socket.emit('leave room', {
                        sender: id,
                        room: 1
                    });
                    s(".left").addClass("fullWidth");
                    s(".chat").hide();
                    s("#roomBtn").html("Enter chat room");
                }
            })
        }
    });

  return (
    <body>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>
        <script src="/socket.io/socket.io.js"></script>
    

        <main>
            <div class="left">
                <div class="wrapper">
                    <h1 class="fadeIn zeroth"><span>Start chatting!</span></h1>
                    <div class="fadeIn second" id="buttons-wrapper">
                        <h2 id="roomBtn" class="underlineHover">Enter chat room</h2>
                    </div>
                </div>
            </div>
            <div class="chat">
                <div>
                    <ul id="messages">
                    </ul>
                </div>

                <form id="message-form">
                    <div id="form-message">
                        <input class="form-control" id="input" autcomplete="off" placeholder="Enter your message..." onfocus="this.placeholder = ''" onblur="this.placeholder='Enter your message...'"></input>   
                        <button type="button" id="send_btn" class="btn btn-light" onclick={sendChat}></button>                 
                    </div>
                </form>
            </div>
        </main>
    </body>
    );
};

export default Chat;
