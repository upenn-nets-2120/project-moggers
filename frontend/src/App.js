import logo from './logo.svg';
import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from './components/NavBar/NavBar';
import Login from './components/Login/Login';
import Register from './components/Register/Register';

function App() {
  return (
      <React.Fragment>
        <NavBar />
        <Routes>
          <Route path='/register' element={<Register />} />
          <Route path = "/login" element = {<Login />} />
        </Routes>
      </React.Fragment>
  );
}

export default App;
