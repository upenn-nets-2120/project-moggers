import React, { useState } from 'react';
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
    <div>
      <h2>Create Post</h2>
      <form onSubmit={handleSubmit}>
        <textarea value={content} onChange={handleContentChange} placeholder="Enter post content"></textarea>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Post;
