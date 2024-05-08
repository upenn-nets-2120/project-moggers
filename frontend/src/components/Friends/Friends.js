import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import ReactSession from '../../ReactSession';
import Profile from '../Profile/Profile';
import config from '../../serverConfig.json';
import './Friends.css';

function Friends() {
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    var currUserId = ReactSession.get("user_id"); 
    // const currUserId = 4;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        var followersRes = await axios.get(`${config.serverRootURL}/getFollowers?user_id=${currUserId}`);
        if (followersRes.data.followers !== 'undefined') {
            setFollowers(followersRes.data.followers);
        }
        var followingRes = await axios.get(`${config.serverRootURL}/getFollowing?user_id=${currUserId}`);
        if (followingRes.data.following !== 'undefined') {
            setFollowing(followingRes.data.following);
        }
        var friendRequestsRes = await axios.get(`${config.serverRootURL}/getFriendRequests?id=${currUserId}`);
        if (friendRequestsRes.data.friendRequests !== 'undefined') {
            setFriendRequests(friendRequestsRes.data.friendRequests);
        }
        console.log(followers);
        console.log(currUserId);
        const recommendationsRes = await axios.get(`${config.serverRootURL}/recommendations?user_id=${currUserId}`);
        console.log(recommendationsRes.data.recommendations);
        if (recommendationsRes.data.recommendations !== 'undefined') {
            setRecommendations(recommendationsRes.data.recommendations);
        }
    };

    const sendFriendRequest = async (followedId) => {
        await axios.post(`${config.serverRootURL}/sendFriendRequest`, { follower: currUserId, followed: followedId });
        setRecommendations(recommendations.filter(recommendation => recommendation.id !== followedId));
        fetchData();
    };

    const acceptFriendRequest = async (followerId) => {
        await axios.post(`${config.serverRootURL}/acceptFriendRequest`, { follower: followerId, followed: currUserId });
        setFriendRequests(friendRequests.filter(request => request.id !== followerId));
        fetchData();
    };

    const UserDisplay = ({ user }) => {
        const defaultImageUrl = "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"; 
        return (
        <div className="user-display" key={user.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <img 
            src={user.profilePic || defaultImageUrl} 
            alt={user.username} 
            style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px' }} 
            />
            <div>
            <div style={{ fontWeight: 'bold' }}>
                <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {user.username}
                </Link>
            </div>
            <div>{`${user.firstName} ${user.lastName}`}</div>
            </div>
        </div>
        );
    };

    return (
        <div className="friends-container">
            <div className="column">
                <div className="section-title">Followers</div>
                <div className="section">
                    {followers.length ? followers.map(follower => <UserDisplay key={follower.id} user={follower} />) : "No Followers"}
                </div>
            </div>
            <div className="column">
                <div className="section-title">Following</div>
                <div className="section">
                    {following.length ? following.map(follow => <UserDisplay key={follow.id} user={follow} />) : "No Following"}
                </div>
            </div>
            <div className="column">
                <div className="section-title">Friend Requests</div>
                <div className="section">
                    {friendRequests.length ? friendRequests.map(request => (
                        <div key={request.id} className="user-action-container">
                            <UserDisplay user={request} />
                            <button style={{borderRadius: '5px', backgroundColor: 'green', color: 'white', marginRight: '20px', marginBottom: '10px'}} 
                            onClick={() => acceptFriendRequest(request.id)}>Accept</button>
                        </div>
                    )) : "No Friend Requests"}
                </div><hr></hr>
                <div className="section-title">Recommendations</div>
                <div className="section">
                    {recommendations.length ? recommendations.map(recommendation => (
                        <div key={recommendation.id} className="user-action-container">
                            <UserDisplay user={recommendation} />
                            <button style={{borderRadius: '5px', backgroundColor: 'blue', color: 'white', marginRight: '20px', marginBottom: '10px'}}
                            onClick={() => sendFriendRequest(recommendation.id)}>Request</button>
                        </div>
                    )) : "No Recommendations"}
                </div>
            </div>
        </div>
    );
}

export default Friends;
