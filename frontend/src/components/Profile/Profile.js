import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../serverConfig.json';
import styles from './Profile.module.css';

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [currUserId, setCurrUserId] = useState(2);
  const [currUsername, setCurrUsername] = useState('abc');

  useEffect(() => {
    const setCurrUser = async () => {
        try {
            const res = await axios.get(`${rootURL}/`);
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
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${config.serverRootURL}/getProfile`, {
          params: { user_id: currUserId }
        });
        setProfileData(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileInfo}>
        <h1>Profile</h1>
        <p>Username: {profileData.data1[0].username}</p>
        <p>First Name: {profileData.data1[0].firstName}</p>
        <p>Last Name: {profileData.data1[0].lastName}</p>
        <p>Affiliation: {profileData.data1[0].affiliation}</p>
        <p>Profile Photo: {profileData.data1[0].profilePhoto}</p>
        <p>Hashtags: {profileData.data1[0].hashtags}</p>
        <p>Birthday: {profileData.data1[0].birthday}</p>
        <p>Interests: {profileData.data1[0].interests}</p>
        <p>Followers: <Link to="/friends">{profileData.data1[0].followers}</Link></p>
        <p>Following: <Link to="/friends">{profileData.data1[0].following}</Link></p>
        <p>Status: {profileData.data1[0].status}</p>
      </div>

      {/* Render posts */}
      <h2>Posts</h2>
      <div className={styles.postsGrid}>
        {/* Display posts in a grid */}
        {profileData.posts.map(post => (
        <div key={post.id} className="post">
            <p>Content: {post.content}</p>
            <p>Date Posted: {post.date_posted}</p>
            <p>Number of Likes: {post.num_likes}</p>
            <p>Timestamp: {post.timestamp}</p>
        </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;
