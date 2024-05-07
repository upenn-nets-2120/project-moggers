import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../serverConfig.json';
import styles from './Profile.module.css';
import ReactSession from '../../ReactSession';

function Profile() {
  var { user_id } = useParams();
  if (!user_id || user_id === -1 || user_id === "undefined") { 
    user_id = ReactSession.get("user_id");
  }
  const [profileData, setProfileData] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState("https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (ReactSession.get("user_id") === -1) {
          console.error('Please log in to view profile');
          return;
        }
        const response = await axios.get(`${config.serverRootURL}/getProfile`, {
          params: { user_id: user_id }
          // params: {user_id: 2}
        });
        setProfileData(response.data);
        if (response.data.data1[0].profilePhoto) {
          setProfilePhoto(response.data.data1[0].profilePhoto);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  if (!profileData) {
    return <div style={{textAlign: "center"}}>Loading...</div>;
  }

  const formatDate = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileInfo}>
        <h1>Welcome, {profileData.data1[0].username}</h1>
        <div className={styles.profileHeader}>
          <div className={styles.profileLeft}>
            <img src={profileData.data1[0].profilePhoto || profilePhoto} alt="Profile" className={styles.profilePic} />
            <div>
              <h3>{profileData.data1[0].firstName} {profileData.data1[0].lastName}</h3>
            </div>
          </div>
          <div className={styles.profileRight}>
            <div className={styles.profileRightTop}>
              <p><b>Posts</b>: <Link to="/" className={styles.link}>{profileData.posts.length}</Link></p>
              <p><b>Followers</b>: <Link to="/friends" className={styles.link}>{profileData.data1[0].followers}</Link></p>
              <p><b>Following</b>: <Link to="/friends" className={styles.link}>{profileData.data1[0].following}</Link></p>
            </div>
            <div className={styles.profileRightBottom}>
              <p><b>Birthday</b>: {formatDate(profileData.data1[0].birthday)}</p>
              <p><b>Affiliation</b>: {profileData.data1[0].affiliation}</p>
            </div>
            <div className={styles.profileRightBottom}>
              <p><b>Interests</b>: {profileData.data1[0].interests}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Render posts */}
      <hr></hr>
      <div className={styles.postsGrid}>
        {profileData.posts.slice().reverse().map(post => (
          <div key={post.id} className={styles.post}>
            <p>{formatDate(post.timstamp)}</p>
            {post.image && <img src={post.image} alt="Post" style={{ width: '100%', height: 'auto' }} />}
            <p># of Likes: {post.num_likes}</p>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
