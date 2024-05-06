import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../serverConfig.json';

function Post() {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currUserId, setCurrUserId] = useState(2);
  const [currUsername, setCurrUsername] = useState('abc');

  useEffect(() => {
    const setCurrUser = async () => {
        try {
            const res = await axios.get(`${config.serverRootURL}/`);
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
  }, []);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const signedUrlResponse = await axios.post(`${config.serverRootURL}/get_presigned_url`, {
        fileName: imageFile.name,
        fileType: imageFile.type
      });
      console.log(signedUrlResponse.data);
      const presignedUrl = signedUrlResponse.data.url;

      await fetch(presignedUrl, {
        method: 'PUT',
        body: imageFile
      });

      await axios.post(`${config.serverRootURL}/createPost`, {
        author: currUserId,
        content: content,
        image_url: presignedUrl
      });

      console.log('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '100px' }}>
      <div style={{ width: '400px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', padding: '20px', borderRadius: '8px' }}>
        <h2>Create Post</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <textarea 
            value={content}
            onChange={handleContentChange}
            placeholder="Enter caption and hashtags"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', resize: 'none', height: '100px' }}
          ></textarea>
          <input 
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'block', width: '100%' }}
          />
          <button type="submit" style={{ padding: '10px 0', borderRadius: '4px', border: 'none', color: 'white', backgroundColor: 'blue', cursor: 'pointer' }}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

export default Post;
