import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';

function Home() {
  const [feed, setFeed] = useState([]);
  const [currUserId, setCurrUserId] = useState(2);

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

  return (
    <div>
      <h1>Home Page</h1>
      <div>
        {feed.map(post => (
          <div key={post.id} className="post">
            <h3>{post.username}</h3>
            <p>{post.content}</p>
            {post.image && <img src={post.image} alt="Post" />}
            <p>Likes: {post.like_count}</p>
            <p>Posted on: {post.date_posted}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
