import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';

const defaultTopHashtags = [
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
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [customHashtag, setCustomHashtag] = useState('');
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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('localhost:8080/register', formData);
      console.log(response.data);
      navigate('/login');
    } catch (error) {
      setError(error.response.data.error || 'An error occurred');
    }
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
    setStep(3);
  };

  const handleProfilePhotoChange = (e) => {
    // Handle profile photo upload
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
          <form onSubmit={handleSubmit} className={styles.registerform}>
            {/* Step 3: Profile photo upload */}
            {/* Profile photo upload fields */}
            <button type="submit" className={styles.registerbtn}>Submit</button>
          </form></div>
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
