import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import ReactSession from '../../ReactSession.js';
import PostDetails from '../Post/PostDetails.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComment } from '@fortawesome/free-regular-svg-icons'
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons'
import SearchBar from '../SearchBar/SearchBar.js';

function Home() {
  const [feed, setFeed] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null)
  const [loading, setLoading] = useState(false);
  const [popupPost, setPopupPost] = useState(null);
  const [isSearchResult, setIsSearchResult] = useState(false);

  const navigate = useNavigate();

  var currUserId = ReactSession.get("user_id");
  var currUsername = ReactSession.get("username");

  const rootURL = config.serverRootURL;

  useEffect(() => {
    fetchFeed();
  }, [currUserId]);

  const fetchFeed = async () => {
    setLoading(true);
    currUserId = ReactSession.get("user_id");
    currUsername = ReactSession.get("username");
    try {
      if (currUserId === -1 || currUserId === null) {
        setLoading(false);
        navigate('/login');
      } else {
        const res1 = await axios.post(`${rootURL}/goOnline`,  { username: currUsername }  );
        const response = await axios.get(`${rootURL}/getFeed`, { params: { userId: currUserId } } );
        setLoading(false);
        setFeed(response.data.results);
        setIsSearchResult(false);
        console.log(feed);
        console.log(response.data.results);
        const postIds = response.data.results.map(post => post.id);
        const likeresponse = await axios.post(`${rootURL}/checkLikes`, { postIds, userId: currUserId });
        const likes = likeresponse.data;
        console.log(postIds, likes)
        const updatedFeed = response.data.results.map(post => ({
          ...post,
          hasLiked: likes[post.id]
        }));
  
        setFeed(updatedFeed);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    }
  };

  const toggleLike = async (postId, hasLiked) => {
    const endpoint = hasLiked ? '/removeLike' : '/addLike';
    try {
      console.log(postId, currUserId, endpoint);
      var likeRes = await axios.post(`${rootURL}${endpoint}`, {
        post_id: postId,
        user_id: currUserId
      });
      console.log(likeRes);
      
      setFeed(prevFeed => {
        return prevFeed.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              hasLiked: !hasLiked,
              like_count: hasLiked ? post.like_count - 1 : post.like_count + 1
            };
          }
          return post;
        });
      });
    } catch (error) {
      console.error('Error toggling like:', error);
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

  const handleSearch = (searchResults) => {
    setFeed(searchResults);
    setIsSearchResult(true);
  };

  const handleBack = () => {
    setIsSearchResult(false);
    fetchFeed();
  };

  return (
    <div className={styles.container}>
      {errorMessage ? (
        <h1 style={{ textAlign: "center" }}>{errorMessage}</h1>
      ) : (
        <div className={styles.feed}>
          <div className={styles.header}>
            {isSearchResult && (
              <FontAwesomeIcon icon={faArrowLeft} className={styles.backArrow} onClick={handleBack} />
            )}
          </div>
          <h1 style={{ textAlign: "center", marginTop: "0" }}>Feed</h1>
          <SearchBar onSearch={handleSearch} /> 
          {loading ? (
            <p>Loading...</p>
          ) : ( <>
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
                    <button className={post.hasLiked ? styles.likedHeart : styles.heart} onClick={() => toggleLike(post.id, post.hasLiked)}>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Home;
