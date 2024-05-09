import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactSession from '../../ReactSession';
import Profile from '../Profile/Profile';
import config from '../../serverConfig.json';
import "./ChangeProfile.css"

const ChangeProfile = () => {
    const rootURL = config.serverRootURL;
    var currUserId = ReactSession.get("user_id");

    const [usernameInput, setUsernameInput] = useState(null);
    const [passwordInput, setpasswordInput] = useState(null);
    const [emailInput, setEmailInput] = useState(null);
    const [firstNameInput, setFirstNameInput] = useState(null);
    const [lastNameInput, setLastNameInput] = useState(null);
    const [affiliationInput, setAffiliationInput] = useState(null);
    const [alertText, setAlertText] = useState("");
    const [alertStatus, setAlertStatus] = useState("None");


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

            console.log("change profile: these are the user change params:");
            console.log(response.data.data1[0].username);
            console.log(response.data.data1[0].password);
            console.log(response.data.data1[0].email);
            console.log(response.data.data1[0].firstName);
            console.log(response.data.data1[0].lastName);
            console.log(response.data.data1[0].affiliation);

        }
        fetchAndSet();
    }, [])



    const handleSubmitChanges = (event) => {
        // check if all necessary fields are there
        if (username.length == 0 || email.length == 0 || password.length || 0) {
            setAlertText("Username, email, and password cannot be empty!");
            setAlertStatus("Error");
        }
        const postNewProfileData = async () => {
            newParams = {
                user_id: currUserId, 
                newUsername: usernameInput,
                newPassword: passwordInput,
                newEmail:emailInput,
                newfirstName: firstNameInput,
                newLastName: lastNameInput,
                newAffiliation: affiliationInput
            }
            const res = await axios.post(`${rootURL}/updateProfile`, newParams);
        }

        setAlertText("Success!");
        setAlertStatus("Complete!")
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

            <div className={alertStatus}>
                {alertText}
            </div> 

            <button type="submit" className="btn btn-primary" onClick={handleSubmitChanges}>Save Changes</button>
        </div>
    );
}

export default ChangeProfile;
