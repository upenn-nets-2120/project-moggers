import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import config from '../../serverConfig.json';
import styles from './Profile.module.css';
import ReactSession from '../../ReactSession';

function Profile() {
  const { user_id: paramUserId } = useParams();
  let currUserId;
  if (!paramUserId || paramUserId === -1 || paramUserId === "undefined") { 
    currUserId = ReactSession.get("user_id");
  }
  const [profileData, setProfileData] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState("https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png");
  const [searchUsername, setSearchUsername] = useState('');
  const [searchedUserId, setSearchedUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = paramUserId || currUserId;
        if (ReactSession.get("user_id") === -1) {
          console.error('Please log in to view profile');
          return;
        }
        const response = await axios.get(`${config.serverRootURL}/getProfile`, {
          params: { user_id: userId }
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
  }, [paramUserId, currUserId]);

  if (!profileData) {
    return <div style={{textAlign: "center"}}>Loading...</div>;
  }

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${config.serverRootURL}/getUserName`, {
        params: { username: searchUsername }
      });
      const { id } = response.data.data;
      if (id !== -1) {
        navigate(`/profile/${id}`);
      } else {
        console.error('User not found');
      }
    } catch (error) {
      console.error('Error searching for user:', error);
    }
  };

  const handleAddFriend = async () => {
    try {
      await axios.post(`${config.serverRootURL}/sendFriendRequest`, {
        follower: ReactSession.get("user_id"),
        followed: paramUserId
      });
      console.log('Friend request sent successfully');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const formatDate = (date) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  return (
    <div className={styles.container}>
      <div className={styles.profileInfo}>
      <form onSubmit={handleSearchSubmit}>
            <input
              style={{width: "80%", borderRadius: "5px", marginTop: "10px", marginBottom: "20px", padding: "5px", border: "1px solid lightgray"}}
              type="text"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Search by username"
            />
            <button style={{border: "None", borderRadius: "5px", marginLeft: "10px", background: "blue", color: "white"}} type="submit">Search</button>
        </form>
      {(paramUserId === currUserId || paramUserId === undefined) && (
        <h1>Welcome, {profileData.data1[0].username}</h1> )}
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
            <div className={styles.profileRightBottom}>
              {paramUserId && currUserId === profileData.data1[0].id && (
                <button style={{borderRadius: '5px', backgroundColor: 'blue', color: 'white', marginRight: '20px', marginBottom: '10px'}} onClick={handleAddFriend}>Add Friend</button>
              )}
            </div>
          </div>
        </div>
        {(paramUserId === currUserId || paramUserId === undefined) && (
        <Link to="/changeProfile" className={styles.settingsButton}>
          <FontAwesomeIcon icon={faCog} />
        </Link>)}
      </div>

      {/* Render posts */}
      <hr></hr>
      <div className={styles.postsGrid}>
        {profileData.posts.slice().reverse().map(post => (
          <div key={post.id} className={styles.post}>
            <p>{formatDate(post.timstamp)}</p>
            {post.image && <img src={post.image} alt="Post" style={{ width: '100%', height: '180px' }} />}
            <p>♥ {post.num_likes}</p>
            <p>{post.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Profile;
