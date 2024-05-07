import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import ReactSession from '../../ReactSession.js';

function Home() {
  const [feed, setFeed] = useState([]);
  const [currUserId, setCurrUserId] = useState(null);
  const [currUsername, setCurrUsername] = useState(null);
  const [comments, setComments] = useState({});
  const [commentThreads, setCommentThreads] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  const rootURL = config.serverRootURL;

  useEffect(() => {
    // const setCurrUser = async () => {
        // try {
            // const res = await axios.get(`${rootURL}/`);
            // const user_id = res.data.user_id;
            // const username = res.data.username;

            // if (user_id !== -1) {
            //     setCurrUserId(user_id);
            //     setCurrUsername(username);
            // }
    //         setCurrUserId(ReactSession.get("user_id"));
    //         setCurrUsername(ReactSession.get("username"));
    //         console.log("currUserId: ", currUserId);
    //     } catch (error) {
    //         console.log(error);
    //     }
    // }
    
    const fetchFeed = async () => {
      setCurrUserId(ReactSession.get("user_id"));
      setCurrUsername(ReactSession.get("username"));
      console.log("currUserId: ", currUserId);
      console.log(ReactSession.get("user_id"));
      try {
        if (ReactSession.get("user_id") === -1 || ReactSession.get("user_id") === null) {
          navigate('/login');
        } else {
          const response = await axios.get(`${rootURL}/getFeed`, { params: { userId: ReactSession.get("user_id") } } );
          setFeed(response.data.results);
        }
      } catch (error) {
        console.error('Error fetching feed:', error);
      }
    };
    fetchFeed();
  }, []);

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
                <h3>{post.username}</h3>
                <p>{post.content}</p>
                {post.image && <img src={post.image} alt="Post" />}
                <p>Likes: {post.like_count}</p>
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
