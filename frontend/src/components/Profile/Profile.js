import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../serverConfig.json';
import styles from './Profile.module.css';
import ReactSession from '../../ReactSession';

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [currUserId, setCurrUserId] = useState(-1);
  const [currUsername, setCurrUsername] = useState('abc');

  useEffect(() => {
    const setCurrUser = async () => {
        try {
            // const res = await axios.get(`${config.serverRootURL}/`);
            // const user_id = res.data.user_id;
            // const username = res.data.username;

            // if (user_id !== -1) {
            //   setCurrUserId(user_id);
            //   setCurrUsername(username);
            // }
            setCurrUserId(ReactSession.get("user_id"));
            setCurrUsername(ReactSession.get("username"));
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
    return <div style={{textAlign: "center"}}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.profileInfo}>
        <h1 style={{textAlign: "center"}}><b>Profile</b></h1>
        <p><b>Username</b>: {profileData.data1[0].username}</p>
        <p><b>First Name</b>: {profileData.data1[0].firstName}</p>
        <p><b>Last Name</b>: {profileData.data1[0].lastName}</p>
        <p><b>Affiliation</b>: {profileData.data1[0].affiliation}</p>
        <p><b>Profile Photo</b>: {profileData.data1[0].profilePhoto}</p>
        <p><b>Hashtags</b>: {profileData.data1[0].hashtags}</p>
        <p><b>Birthday</b>: {profileData.data1[0].birthday}</p>
        <p><b>Interests</b>: {profileData.data1[0].interests}</p>
        <p><b>Followers</b>: <Link to="/friends">{profileData.data1[0].followers}</Link></p>
        <p><b>Following</b>: <Link to="/friends">{profileData.data1[0].following}</Link></p>
      </div>

      {/* Render posts */}
      <h1>Posts</h1>
      <div className={styles.postsGrid}>
        {/* Display posts in a grid */}
        {profileData.posts.map(post => (
        <div key={post.id} className="post">
            <p>Content: {post.content}</p>
            <p>Date Posted: {post.timstamp}</p>
            <p>Number of Likes: {post.num_likes}</p>
        </div>
        ))}
      </div>
    </div>
  );
}

export default Profile;
