import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import ReactSession from '../../ReactSession.js';

function Home() {
  const [feed, setFeed] = useState([]);
  const [comments, setComments] = useState({});
  const [commentThreads, setCommentThreads] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
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
  }, []);

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

  const handleGetComments = async (postId) => {
    try {
      const response = await axios.get(`${rootURL}/getComments`, { params: { postId } });
      setComments({ ...comments, [postId]: response.data.data });
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleGetCommentThreads = async (postCommentId) => {
    try {
      const response = await axios.get(`${rootURL}/getCommentThreads`, { params: { postCommentId } });
      setCommentThreads({ ...commentThreads, [postCommentId]: response.data.data });
    } catch (error) {
      console.error('Error fetching comment threads:', error);
    }
  };

  return (
    <div className={styles.container}>
      {errorMessage ? (
        <h1 style={{ textAlign: "center" }}>{errorMessage}</h1>
      ) : (
        <div className={styles.feed}>
          <h1 style={{ textAlign: "center" }}>Feed</h1>
          {feed.length > 0 ? (
            feed.slice().reverse().map(post => (
              <div key={post.id} className={styles.post}>
                <div className={styles.postHeader}>
                  <h3>{post.username}</h3>
                  <button className={post.hasLiked ? styles.likedHeart : styles.heart} 
                    onClick={() => toggleLike(post.id, post.hasLiked)}>
                    {post.hasLiked ? '♥' : '♡'}
                  </button>
                </div>
                <p>{post.content}</p>
                {post.image && <img src={post.image} alt="Post" />}
                <p style={{fontSize: '20px'}}>♥ {post.like_count}</p>
                <p>Posted on: {new Date(post.timstamp).toLocaleDateString()}</p>
                <button onClick={() => handleGetComments(post.id)}>See Comments</button>
                {comments[post.id] && comments[post.id].length > 0 && (
                  comments[post.id].map(comment => (
                    <div key={comment.comment_id} className={styles.comment}>
                      <p>{comment.content}</p>
                      <button onClick={() => handleGetCommentThreads(comment.comment_id)}>See More</button>
                      {commentThreads[comment.comment_id] && (
                        commentThreads[comment.comment_id].map(thread => (
                          <div key={thread.comment_id} className={styles.commentThread}>
                            <p>{thread.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  ))
                )}
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
