import logo from './logo.svg';
import './App.css';
import React from "react";
import { Routes, Route } from "react-router-dom";
import NavBar from './components/NavBar/NavBar';
import Login from './components/Login/Login';
import Register from './components/Register/Register';

function App() {
  return (
    <div className="Moggerstagram">
      <React.Fragment>
        <NavBar />
        <Routes>
          <Route path = "/register" component = { Register } />
        </Routes>
      </React.Fragment>
    </div>
  );
}

export default App;
