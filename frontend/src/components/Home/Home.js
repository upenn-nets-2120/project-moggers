import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import ReactSession from '../../ReactSession.js';
import PostDetails from '../Post/PostDetails.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComment } from '@fortawesome/free-regular-svg-icons'

function Home() {
  const [feed, setFeed] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [popupPost, setPopupPost] = useState(null);
  const navigate = useNavigate();
  var currUserId = ReactSession.get("user_id");
  var currUsername = ReactSession.get("username");

  const rootURL = config.serverRootURL;

  useEffect(() => {
    const fetchFeed = async () => {
      currUserId = ReactSession.get("user_id");
      currUsername = ReactSession.get("username");
      try {
        if (currUserId === -1 || currUserId === null) {
          navigate('/login');
        } else {
          const response = await axios.get(`${rootURL}/getFeed`, { params: { userId: currUserId } } );
          setFeed(response.data.results);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
      }
    };
    fetchFeed();
  }, [currUserId]);

  const toggleLike = async (postId, hasLiked) => {
    const endpoint = hasLiked ? '/removeLike' : '/addLike';
    try {
      await axios.post(`${rootURL}${endpoint}`, {
        post_id: postId,
        user_id: currUserId
      });
      const updatedFeed = await axios.get(`${rootURL}/getFeed`, { params: { userId: currUserId } });
      setFeed(updatedFeed.data.results);
    } catch (error) {
      console.error('Error toggling like:', error);
      setErrorMessage('Error processing your like. Please try again.');
    }
  };

  const openCommentPopup = (post) => {
    console.log("open");
    setPopupPost(post);
  };

  const closeCommentPopup = () => {
    console.log("close");
    setPopupPost(null);
  };

  return (
    <div className={styles.container}>
      {errorMessage ? (
        <h1 style={{ textAlign: "center" }}>{errorMessage}</h1>
      ) : (
        <div className={styles.feed}>
          <h1 style={{ textAlign: "center" }}>Feed</h1>
          {popupPost && (
            <PostDetails post={popupPost} onClose={closeCommentPopup} />
          )}
          {feed.length > 0 ? (
            feed.slice().reverse().map(post => (
              <div key={post.id} className={styles.post}>
                <div className={styles.postHeader}>
                  <div className={styles.userInfo}>
                    <img
                      src={post.profilePhoto || "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"}
                      alt="Profile pic"
                      className={styles.profilePic}
                    />
                    <div>
                      <h3 className={styles.username}>{post.username}</h3>
                      <p className={styles.fullName}>
                        {post.firstName} {post.lastName}
                      </p>
                    </div>
                  </div>
                  <p>{new Date(post.timstamp).toLocaleDateString()}</p>
                </div>
                {post.image && <img src={post.image} alt="Post" />}
                <div className={styles.postContent}>
                  <button className={post.hasLiked ? styles.likedHeart : styles.heart} 
                      onClick={() => toggleLike(post.id, post.hasLiked)}>
                      {post.hasLiked ? '♥' : '♡'} {post.like_count}
                  </button>
                  <button className={styles.comment} onClick={() => openCommentPopup(post)}>
                    <FontAwesomeIcon icon={faComment} />
                  </button>
                </div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
              </div>
            ))
          ) : (
            <p>No posts to display.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
