import logo from './logo.svg';
import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from './components/NavBar/NavBar';
import Login from './components/Login/Login';
import Register from './components/Register/Register';
import Chat from "./components/Chat/chat.js";
import Home from "./components/Home/Home.js";
import Friends from "./components/Friends/Friends.js";
import Profile from "./components/Profile/Profile.js";
import Post from "./components/Post/Post.js";
import ReactSession from './ReactSession.js';

function App() {
  return (
      ReactSession.setStoreType("localStorage"),
      <React.Fragment>
        <NavBar />
        <Routes>
          <Route path="/" element = {<Home/>}/>
          <Route path="/profile" element={<Profile/>}/>
          <Route path="/post" element={<Post/>}/>
          <Route path= "/chat" element ={<Chat/>}/>
          <Route path= "/friends" element={<Friends />} />
          <Route path= "/register" element={<Register />}/>
          <Route path = "/login" element ={<Login />} />
        </Routes>
      </React.Fragment>
  );
}

export default App;
