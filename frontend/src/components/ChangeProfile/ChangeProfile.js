import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactSession from '../../ReactSession';
import Profile from '../Profile/Profile';
import config from '../../serverConfig.json';
import {useNavigate} from 'react-router-dom';
import "./ChangeProfile.css"
import styles from '../Register/Register.module.css';

const ChangeProfile = () => {
    const rootURL = config.serverRootURL;
    var currUserId = ReactSession.get("user_id");

    const [usernameInput, setUsernameInput] = useState(null);
    const [passwordInput, setpasswordInput] = useState(null);
    const [emailInput, setEmailInput] = useState(null);
    const [firstNameInput, setFirstNameInput] = useState(null);
    const [lastNameInput, setLastNameInput] = useState(null);
    const [affiliationInput, setAffiliationInput] = useState(null);

    const [selectedHashtags, setSelectedHashtags] = useState([]);
    const [customHashtag, setCustomHashtag] = useState('');
    const [defaultTopHashtags, setDefaultTopHashtags] = useState([]);
    const [profilePhoto, setProfilePhoto] = useState(null);

    const [s3FileName, setS3FileName] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    const [alertText, setAlertText] = useState("");
    const [alertStatus, setAlertStatus] = useState("None");

    const navigate = useNavigate();

    // const [newUsernameInput, setNewUsernameInput] = useState(null);
    // const [newPasswordInput, setNewpasswordInput] = useState(null);
    // const [newEmailInput, setNewEmailInput] = useState(null);
    // const [newFirstNameInput, setNewFirstNameInput] = useState(null);
    // const [newLastNameInput, setNewLastNameInput] = useState(null);
    // const [newAffiliationInput, setNewAffiliationInput] = useState(null);
    
    useEffect(() => {
        async function fetchAndSet() {
            const response = await axios.get(`${rootURL}/getProfile`, {
                params: { user_id: currUserId }
            });

            setUsernameInput(response.data.data1[0].username);
            setpasswordInput(response.data.data1[0].password);
            setEmailInput(response.data.data1[0].email);
            setFirstNameInput(response.data.data1[0].firstName);
            setLastNameInput(response.data.data1[0].lastName);
            setAffiliationInput(response.data.data1[0].affiliation);
            setS3FileName(response.data.data1[0].profilePhoto);
            setSelectedHashtags(response.data.data1[0].interests.split(',') || []);

            console.log("change profile: these are the user change params:");
            console.log(response.data.data1[0].username);
            console.log(response.data.data1[0].password);
            console.log(response.data.data1[0].email);
            console.log(response.data.data1[0].firstName);
            console.log(response.data.data1[0].lastName);
            console.log(response.data.data1[0].affiliation);

        }
        fetchAndSet();
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
    }, [])

    const addInterest = async (interest) => {
        try {
            const response = await axios.post(`${config.serverRootURL}/addInterests`, { name: interest });
            console.log(response.data);
        } catch (error) {
            console.error('Error adding interest:', error);
        }
    };

    const changePic = async (e) => {
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
        } catch (error) {
          console.log("Error", error);
        }
      };
    
      const handleHashtagClick = async (hashtag) => {
        const isSelected = selectedHashtags.includes(hashtag);
        if (isSelected) {
          setSelectedHashtags(selectedHashtags.filter(item => item !== hashtag));
        } else {
          setSelectedHashtags([...selectedHashtags, hashtag]);
        }
      };
    
    const handleCustomHashtagChange = async (e) => {
        setCustomHashtag(e.target.value);
    };
    
    const handleAddCustomHashtag = async () => {
        if (customHashtag.trim() === '') {
          setAlertText('Please enter a valid hashtag');
          return;
        }
        setSelectedHashtags([...selectedHashtags, customHashtag]);
        console.log(selectedHashtags);
        setCustomHashtag('');
        setAlertText('');
    };

    const handleProfilePhotoChange = async (e) => {
        const file = e.target.files[0]; 
        setProfilePhoto(file);
    };
    
    const handleImageSelect = async (image) => {
        setSelectedImage(image);
    };

    const handleSubmitChanges = async (event) => {
        // check if all necessary fields are there
        try {
            // combine selected hashtags into comma separated string and add to formData
            for (const hashtag of selectedHashtags) {
                await addInterest(hashtag);
            }
            const interests = selectedHashtags.join(',');

            const postNewProfileData = async () => {
                const newParams = {
                    user_id: currUserId, 
                    newUsername: usernameInput,
                    newPassword: passwordInput,
                    newEmail: emailInput,
                    newfirstName: firstNameInput,
                    newLastName: lastNameInput,
                    newAffiliation: affiliationInput,
                    newProfilePhoto: s3FileName,
                    newInterests: interests
                }
                const res = await axios.post(`${rootURL}/updateProfile`, newParams);
            }
            postNewProfileData();
    
            setAlertText("Success!");
            setAlertStatus("Complete!")
            
            const response = await axios.post(`${config.serverRootURL}/changeProfile`, postNewProfileData);
            console.log(response.data);
            // setCookie('user_id', response.data.user_id, { path: `${config.serverRootURL}/` });
            // setCookie('username', response.data.username, { path: `${config.serverRootURL}/` });
            ReactSession.set("username", response.data.username);
            console.log(ReactSession.get("user_id"));
            navigate('/profile');
          } catch (error) {
            setAlertText(error.response.data.error || 'An error occurred');
          }
    };

    return (
        <div className="profile-container">
            <h2>Change Profile Information</h2>
            <label htmlFor="username">Username:</label>
            <input style={{width: "75%", marginLeft: "10px"}}
                // placeholder={usernameInput}
                className="paramChanges"
                value={usernameInput}
                onChange={(event) => setUsernameInput(event.target.value)}
            />
            <label htmlFor="email">Email:</label>
            <input style={{width: "75%", marginLeft: "10px"}}
                // placeholder={emailInput}
                className="paramChanges"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
            />
            <label htmlFor="firstName">First Name:</label>
            <input style={{width: "75%", marginLeft: "10px"}}
                // placeholder={firstNameInput}
                className="paramChanges"
                value={firstNameInput}
                onChange={(event) => setFirstNameInput(event.target.value)}
            />
            <label htmlFor="lastName">Last Name:</label>
            <input style={{width: "75%", marginLeft: "10px"}}
                // placeholder={lastNameInput}
                className="paramChanges"
                value={lastNameInput}
                onChange={(event) => setLastNameInput(event.target.value)}
            />
            <label htmlFor="affiliation">Affiliation:</label>
            <input style={{width: "75%", marginLeft: "10px"}}
                // placeholder={affiliationInput}
                className="paramChanges"
                value={affiliationInput}
                onChange={(event) => setAffiliationInput(event.target.value)}
            />
            <label htmlFor="password">Password:</label>
            <input style={{width: "75%", marginLeft: "10px"}}
                // placeholder={passwordInput}
                type="password"
                className="passwordChange"
                value={passwordInput}
                onChange={(event) => setAffiliationInput(event.target.value)}
            />
            {alertStatus !== "None" && (
                <div className={alertStatus}>
                    {alertText}
                </div> 
            )}

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
                <div className={styles.selectedHashtags}>
                <h4><b>Selected Hashtags:</b></h4>
                <ul>
                    {selectedHashtags.map(hashtag => (
                    <li key={hashtag}>{hashtag}</li>
                    ))}
                </ul>
            </div>
            <div><input type="file" onChange={handleProfilePhotoChange} />
            <button className={styles.registerbtn} style={{backgroundColor: 'green', width: '80px', height: '35px', marginTop: '8px', fontSize: '14px'}} type="submit">Upload</button>
            </div><br></br><br></br>

            <button type="submit" className="btn btn-primary" onClick={handleSubmitChanges}>Save Changes</button>
        </div>
    );
}

export default ChangeProfile;
