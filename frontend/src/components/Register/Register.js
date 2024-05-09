import React, { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from '../../serverConfig.json';
import styles from './Register.module.css';
import ReactSession from '../../ReactSession';

const Register = () => {
  const [step, setStep] = useState(1);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [customHashtag, setCustomHashtag] = useState('');
  // const [cookies, setCookie] = useCookies(['user_id', 'username']);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    affiliation: '',
    birthday: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState('');
  const [similarImages, setSimilarImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [s3FileName, setS3FileName] = useState('');
  const [defaultTopHashtags, setDefaultTopHashtags] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const response = await axios.get(`${config.serverRootURL}/getTopTenHashtags`);
        setDefaultTopHashtags(response.data.topTen);
      } catch (error) {
        console.log(error);
        setDefaultTopHashtags([
          'nature',
          'food',
          'travel',
          'fitness',
          'art',
          'music',
          'photography',
          'fashion',
          'technology',
          'sports'
        ]);
      }
    };
    fetchHashtags();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // combine selected hashtags into comma separated string and add to formData
      console.log("form data", formData);
      // setFormData({ ...formData, hashtags: interests, profilePhoto: `https://moggers-image-uploads.s3.amazonaws.com/${s3FileName}` });
      console.log(formData);
      console.log("selected hashtags", selectedHashtags);
      console.log(selectedHashtags.join(','));
      const response = await axios.post(`${config.serverRootURL}/register`, { ...formData, hashtags: selectedHashtags.join(', '), profilePhoto: `https://moggers-image-uploads.s3.amazonaws.com/${s3FileName}` });
      console.log(response.data.message);
      // setCookie('user_id', response.data.user_id, { path: `${config.serverRootURL}/` });
      // setCookie('username', response.data.username, { path: `${config.serverRootURL}/` });
      // const responseData = JSON.parse(response.data.message);
      ReactSession.set("user_id", response.data.user_id);
      ReactSession.set("username", response.data.username);
      console.log(ReactSession.get("user_id"));
    } catch (error) {
      console.log("Error", error);
      setError('An error occurred');
    }
    navigate('/profile');
  };

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    setError('');
    try {
      for (const key in formData) {
        if (!formData[key]) {
          setError(`Please fill in ${key}`);
          return;
        }
      }
      setStep(2);
    } catch (error) {
      setError(error.response.data.error || 'An error occurred');
    }
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    try {
      // add interests to database
      for (const hashtag of selectedHashtags) {
        await addInterest(hashtag);
      }

      setStep(3);
    } catch (error) {
      setError('Error selecting interests');
    }
  };

  const addInterest = async (interest) => {
      try {
          const response = await axios.post(`${config.serverRootURL}/addInterests`, { name: interest });
          console.log(response.data);
      } catch (error) {
          console.error('Error adding interest:', error);
      }
  };

  const handleSubmitStep3 = async (e) => {
    e.preventDefault();
    try {
      console.log(profilePhoto.name);
      const signedUrlResponse = await axios.post(`${config.serverRootURL}/get_presigned_url`, { fileName: profilePhoto.name, fileType: profilePhoto.type});
      console.log(signedUrlResponse.data);
      console.log(signedUrlResponse.data.url);
      setS3FileName(signedUrlResponse.data.fileName);
      const updatedProfilePhoto = new File([profilePhoto], signedUrlResponse.data.fileName, 
        { type: profilePhoto.type }
      );
      console.log(updatedProfilePhoto.name);
      try {
        await fetch(signedUrlResponse.data.url, {
          method: 'PUT',
          body: updatedProfilePhoto
        });
        console.log('File successfully uploaded to S3');
      } catch (error) {
        console.error('Error uploading profile photo:', error);
      };

      // const response = await axios.post(`${config.serverRootURL}/findMatches`, {
      //   fileName: signedUrlResponse.data.fileName
      // });
      // console.log(response.data);
      // setSimilarImages(response.data.similarImages);
      // setStep(4);
    } catch (error) {
      console.log("Error", error);
      setError('Error uploading profile photo');
    }
  };

  const handleHashtagClick = (hashtag) => {
    const isSelected = selectedHashtags.includes(hashtag);
    if (isSelected) {
      setSelectedHashtags(selectedHashtags.filter(item => item !== hashtag));
    } else {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };

  const handleCustomHashtagChange = (e) => {
    setCustomHashtag(e.target.value);
  };

  const handleAddCustomHashtag = () => {
    if (customHashtag.trim() === '') {
      setError('Please enter a valid hashtag');
      return;
    }
    setSelectedHashtags([...selectedHashtags, customHashtag]);
    console.log(selectedHashtags);
    setCustomHashtag('');
    setError('');
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files[0]; 
    setProfilePhoto(file);
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
          <h1 style={{ 'textAlign': 'center'}}>Register</h1>
          <form onSubmit={handleSubmitStep1} className={styles.registerform}>
            <div className={styles.formgroup}>
              <label htmlFor="username">Username:</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} />
            </div>
            <div className={styles.formgroup}>
              <label htmlFor="password">Password:</label>
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
            </div>
            <div className={styles.formgroup}>
              <label htmlFor="firstName">First Name:</label>
              <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
            </div>
            <div className={styles.formgroup}>
              <label htmlFor="lastName">Last Name:</label>
              <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
            </div>
            <div className={styles.formgroup}>
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className={styles.formgroup}>
              <label htmlFor="affiliation">Affiliation:</label>
              <input type="text" id="affiliation" name="affiliation" value={formData.affiliation} onChange={handleChange} />
            </div>
            <div className={styles.formgroup}>
              <label htmlFor="birthday">Birthday:</label>
              <input type="date" id="birthday" name="birthday" value={formData.birthday} onChange={handleChange} />
            </div>
            <button type="submit" className={styles.registerbtn}>Next</button>
            <p style={{ 'textAlign': 'center', marginTop: '10px'}}>Have an account already? <a href="/login">Sign in</a></p>
          </form></div>
        );
      case 2:
        return (
          <div><h2 style={{ 'textAlign': 'center', 'marginBlock': '15px'}}><b>Choose Your Interests</b></h2>
          <form onSubmit={handleSubmitStep2} className={styles.registerform}>
            <div className={styles.hashtagsContainer}>
              {defaultTopHashtags.map(hashtag => (
                <button
                  key={hashtag} type="button"
                  className={`${styles.hashtag} ${selectedHashtags.includes(hashtag) ? styles.selected : ''}`}
                  onClick={() => handleHashtagClick(hashtag)}
                >
                  {hashtag}
                </button>
              ))}
            </div>
            <div className={styles.customHashtagInput}>
              <input
                type="text"
                value={customHashtag}
                onChange={handleCustomHashtagChange}
                placeholder="Enter custom hashtag"
              />
              <button type="button" onClick={handleAddCustomHashtag}>Add</button>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.selectedHashtags}>
              <h4><b>Selected Hashtags:</b></h4>
              <ul>
                {selectedHashtags.map(hashtag => (
                  <li key={hashtag}>{hashtag}</li>
                ))}
              </ul>
            </div>
            <button type="submit" className={styles.registerbtn}>Next</button>
          </form></div>
        );
      case 3:
        return (
          <div><h2 style={{ 'textAlign': 'center', 'marginBlock': '25px'}}><b>Select a Profile Photo</b></h2>
          
          <form onSubmit={handleSubmitStep3}>
            {/* Step 3: Profile photo upload */}
            <input type="file" onChange={handleProfilePhotoChange} />
            <button className={styles.registerbtn} style={{backgroundColor: 'green', width: '80px', height: '35px', marginTop: '8px', fontSize: '14px'}} type="submit">Upload</button>
            <br></br><br></br>
          </form>
          <button className={styles.registerbtn} onClick={handleSubmit}>Submit</button>
          </div>
        );
      case 4:
        return (
          <div>
            {/* Step 4: Display similar images */}
            {similarImages.map(image => (
              <img
                key={image.id}
                src={image.url}
                alt={image.description}
                onClick={() => handleImageSelect(image)}
                style={{ cursor: 'pointer', border: selectedImage === image ? '2px solid red' : 'none' }}
              />
            ))}
            <button onClick={handleSubmit}>Submit</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.register}>
      {error && <div className={styles.error}>{error}</div>}
      {renderStep()}
      
    </div>
  );
};

export default Register;
