import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../serverConfig.json';

function Friends() {
  const [currUserId, setCurrUserId] = useState(2);
  const [currUsername, setCurrUsername] = useState('abc');

  useEffect(() => {
    const setCurrUser = async () => {
        try {
            const res = await axios.get(`${config.serverRootURL}/`);
            const user_id = res.data.user_id;
            const username = res.data.username;

            if (user_id !== -1) {
                setCurrUserId(user_id);
                setCurrUsername(username);
            }
        } catch (error) {
            console.log(error);
        }
    }
    setCurrUser();
  }, []);

  return (
    <div></div>
  );
}

export default Friends;
