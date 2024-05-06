import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';
import styles from './Home.module.css';

function Home() {
  const [feed, setFeed] = useState([]);
  const [currUserId, setCurrUserId] = useState(2);
  const [currUsername, setCurrUsername] = useState('abc');
  const [comments, setComments] = useState({});
  const [commentThreads, setCommentThreads] = useState({});

  const rootURL = config.serverRootURL;

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
    
    const fetchFeed = async () => {
      try {
        const response = await axios.get(`${rootURL}/getFeed`, { params: { userId: currUserId } } );
        setFeed(response.data.results);
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
    <div>
      <h1 style={{marginTop: "30px", textAlign: "center"}}>Feed</h1>
      <div>
        {feed.map(post => (
          <div key={post.id} className="post">
            <h3>{post.username}</h3>
            <p>{post.content}</p>
            {post.image && <img src={post.image} alt="Post" />}
            <p>Likes: {post.like_count}</p>
            <p>Posted on: {post.date_posted}</p>
            <button onClick={() => handleGetComments(post.id)}>See Comments</button>
            {comments[post.id] && (
              <div>
                {comments[post.id].map(comment => (
                  <div key={comment.comment_id} className="comment">
                    <p>{comment.content}</p>
                    <button onClick={() => handleGetCommentThreads(comment.comment_id)}>See More</button>
                    {commentThreads[comment.comment_id] && (
                      <div>
                        {commentThreads[comment.comment_id].map(thread => (
                          <div key={thread.comment_id} className="comment-thread">
                            <p>{thread.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
