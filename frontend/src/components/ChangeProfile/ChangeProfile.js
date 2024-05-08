import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactSession from '../../ReactSession';
import Profile from '../Profile/Profile';
import config from '../../serverConfig.json';
import "./ChangeProfile.css"

const ChangeProfile = () => {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log('Profile updated successfully!');
    };

    return (
        <div className="profile-container">
        <h2>Change Profile Information</h2>
        <form onSubmit={handleSubmit}>
            <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
                type="text"
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="form-control"
            />
            </div>
            <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
                type="password"
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="form-control"
            />
            </div>
            <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="form-control"
            />
            </div>
            <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
        </div>
    );
}

export default ChangeProfile;
