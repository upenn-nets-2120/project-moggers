import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../serverConfig.json';
import JSON from 'json5';
import ReactSession from '../../ReactSession';

function Post() {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  var [currUserId, setCurrUserId] = useState(null);
  var [currUsername, setCurrUsername] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    currUserId = ReactSession.get("user_id");
    currUsername = ReactSession.get("username");
  }, []);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        var signedUrlResponse = await axios.post(`${config.serverRootURL}/get_presigned_url`, {
            fileName: imageFile.name,
            fileType: imageFile.type
        });
        console.log(signedUrlResponse.data);
        var presignedUrl = signedUrlResponse.data.url;

        await fetch(presignedUrl, {
            method: 'PUT',
            body: imageFile
        });

        console.log("image url: ", `https://moggers-image-uploads.s3.amazonaws.com/${signedUrlResponse.data.fileName}`)
        await axios.post(`${config.serverRootURL}/createPost`, {
            author: ReactSession.get("user_id"),
            content: content,
            image_url: `https://moggers-image-uploads.s3.amazonaws.com/${signedUrlResponse.data.fileName}`
        });

        console.log('Post created successfully!');
        navigate('/profile');
    } catch (error) {
        console.error('Error creating post:', error);
        navigate('/profile');
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
          {isLoading ? (
            <p>Loading...</p>
          ) : (
          <button type="submit" style={{ padding: '10px 0', borderRadius: '4px', border: 'none', color: 'white', backgroundColor: 'blue', cursor: 'pointer' }}>
              Submit
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Post;
