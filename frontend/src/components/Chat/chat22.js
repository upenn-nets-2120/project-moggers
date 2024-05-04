import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
// var jqueryScript = document.createElement('script');
// jqueryScript.src = "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js";
// document.head.appendChild(jqueryScript);

// // Include Socket.IO library
// var socketIoScript = document.createElement('script');
// socketIoScript.src = "/socket.io/socket.io.js";
// document.head.appendChild(socketIoScript);

const Chat = () => {
    var socket = io();
    var id = Math.random();
    var room = false;

    // client sending message
    // function sendChat() {
    //     const new_msg = $('#input').val().trim();
    //     if (new_msg !== '') {
    //         socket.emit('chat message', {
    //             text: new_msg,
    //             sender: id,
    //             room: 1
    //         });
            
    //         // reset to blank
    //         $('#input').val('');
    //         $('#input').focus();
    //     }
    // }
    function sendChat() {
        const inputElement = document.getElementById('input');
        const new_msg = inputElement.value.trim();
        if (new_msg !== '') {
            socket.emit('chat message', {
                text: new_msg,
                sender: id,
                room: 1
            });
            
            // reset to blank
            inputElement.value = '';
            inputElement.focus();
        }
    }
    

    // client receiving message
    // $(document).ready(function() {
    //     socket.on('chat message', function(msg) {
    //         // render msg
    //         var message_temp = document.createElement("li");
    //         if (id === msg.sender) {
    //             // msg sent by self
    //             message_temp.setAttribute("class", "me");
    //         } else {
    //             message_temp.setAttribute("class", "other");
    //         }
    //         message_temp.appendChild(document.createTextNode(msg.text))
    //         $('#messages').append(message_temp);
    //         $('#messages').animate({
    //             scrollTop: $('#messages').get(0).scrollHeight
    //         }, 0);
    //     })
    // });
    document.addEventListener('DOMContentLoaded', function() {
        var messagesElement = document.getElementById('messages');
        socket.on('chat message', function(msg) {
            // render msg
            var message_temp = document.createElement("li");
            if (id === msg.sender) {
                // msg sent by self
                message_temp.setAttribute("class", "me");
            } else {
                message_temp.setAttribute("class", "other");
            }
            message_temp.appendChild(document.createTextNode(msg.text));
            messagesElement.appendChild(message_temp);
            messagesElement.scrollTop = messagesElement.scrollHeight;
        });
        

        document.getElementById('roomBtn').addEventListener('click', function() {
            // if not in a room rn
            if (!room) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', '/join', true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
                        var data = JSON.parse(xhr.responseText);
                        if (data.success) {
                            room = true;
                            socket.emit('join room', {
                                sender: id,
                                room: 1
                            });
                            document.querySelector(".left").classList.remove("fullWidth");
                            document.querySelector(".chat").style.display = 'block';
                            document.getElementById("roomBtn").innerHTML = "Leave";
                        }
                    }
                };
                xhr.send(JSON.stringify({ room: 1 }));
            } else {
                var xhrLeave = new XMLHttpRequest();
                xhrLeave.open('POST', '/leave', true);
                xhrLeave.setRequestHeader('Content-Type', 'application/json');
                xhrLeave.onreadystatechange = function() {
                    if (xhrLeave.readyState === XMLHttpRequest.DONE && xhrLeave.status === 200) {
                        var data = JSON.parse(xhrLeave.responseText);
                        if (data.success) {
                            room = false;
                            socket.emit('leave room', {
                                sender: id,
                                room: 1
                            });
                            document.querySelector(".left").classList.add("fullWidth");
                            document.querySelector(".chat").style.display = 'none';
                            document.getElementById("roomBtn").innerHTML = "Enter chat room";
                        }
                    }
                };
                xhrLeave.send(JSON.stringify({ room: 1 }));
            }
        });
    });
    
    // handling chat button
    // $("#roomBtn").on("click", function () {
    //     // if not in a room rn
    //     if (!room) {
    //         $.post('/join', { room: 1}, function(data) {
    //             if (data.success) {
    //                 room = true;
    //                 socket.emit('join room', {
    //                     sender: id,
    //                     room: 1
    //                 });
    //                 $(".left").removeClass("fullWidth");
    //                 $(".chat").show();
    //                 $("#roomBtn").html("Leave");
    //             }
    //         });
    //     } else {
    //         $.post('/leave', {room:1}, function(data){
    //             if (data.success) {
    //                 room = false;
    //                 socket.emit('leave room', {
    //                     sender: id,
    //                     room: 1
    //                 });
    //                 s(".left").addClass("fullWidth");
    //                 s(".chat").hide();
    //                 s("#roomBtn").html("Enter chat room");
    //             }
    //         })
    //     }
    // });
    
    

    return (
        <div>
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
        </div>
    );
};

export default Chat;
