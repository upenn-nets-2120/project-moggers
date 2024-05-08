import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../serverConfig.json';
import ReactSession from '../../ReactSession';
import styles from './PostDetails.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComment } from '@fortawesome/free-regular-svg-icons'
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons'

function PostDetails({ post, onClose }) {
    const [comments, setComments] = useState({});
    const [commentThreads, setCommentThreads] = useState({});
    var currUserId = ReactSession.get("user_id");

    const [comment, setComment] = useState('');

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const sendComment = async () => {
        try {
            const response = await axios.post(`${config.serverRootUrl}/sendComment`, {
                post_id: post.id,
                parent_post: null,
                author: post.author,
                content: comment
            });
            console.log(response.data.message);
        } catch (error) {
            console.error('Error sending comment:', error);
        }
    };

    const toggleLike = async (postId, hasLiked) => {
        const endpoint = hasLiked ? '/removeLike' : '/addLike';
        try {
          await axios.post(`${config.rootURL}${endpoint}`, {
            post_id: postId,
            user_id: currUserId
          });
        } catch (error) {
          console.error('Error toggling like:', error);
        }
    };

    const handleGetComments = async (postId) => {
        try {
          const response = await axios.get(`${config.rootURL}/getComments`, { params: { postId } });
          setComments({ ...comments, [postId]: response.data.data });
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
    };

    const handleGetCommentThreads = async (postCommentId) => {
        try {
          const response = await axios.get(`${config.rootURL}/getCommentThreads`, { params: { postCommentId } });
          setCommentThreads({ ...commentThreads, [postCommentId]: response.data.data });
        } catch (error) {
          console.error('Error fetching comment threads:', error);
        }
    };

    return (
        <div className={styles.overlay}>
        <div className={styles.popup}>
        <div className={styles.postDetails}>
            <button style={{marginBottom: '5px', background: 'None', border: 'None', color: 'grey', fontSize: '20px' }} onClick={onClose}><b>X</b></button>
            <div key={post.id} className={styles.post}>
                <div className={styles.postHeader}>
                  <div className={styles.userInfo}>
                    <img
                      src={post.profilePhoto || "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"}
                      alt="Profile pic"
                      className={styles.profilePic}
                    />
                    <div>
                      <h3 className={styles.username}>{post.username}</h3>
                      <p className={styles.fullName}>
                        {post.firstName} {post.lastName}
                      </p>
                    </div>
                  </div>
                  <p>{new Date(post.timstamp).toLocaleDateString()}</p>
                </div>
                {post.image && <img src={post.image} alt="Post" />}
                <div className={styles.postContent}>
                  <button className={post.hasLiked ? styles.likedHeart : styles.heart} 
                      onClick={() => toggleLike(post.id, post.hasLiked)}>
                      {post.hasLiked ? '♥' : '♡'} {post.like_count}
                  </button>
                  <p className={styles.comment}>
                  <FontAwesomeIcon icon={faComment} />
                  </p>
                </div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
              </div>
            {/* {comments[post.id] && comments[post.id].length > 0 && (
                  comments[post.id].map(comment => (
                    <div key={comment.comment_id} className={styles.comment}>
                        <p>{comment.content}</p>
                        <button onClick={() => handleGetCommentThreads(comment.comment_id)}>See More</button>
                        {commentThreads[comment.comment_id] && (
                            commentThreads[comment.comment_id].map(thread => (
                            <div key={thread.comment_id} className={styles.commentThread}>
                                <p>{thread.content}</p>
                            </div>
                            ))
                        )}`
                    </div>
                ))
            )} */}
            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', position: 'absolute', top: '93%', width: '95%'}}>
                <input type="text" value={comment} onChange={handleCommentChange}
                    placeholder="Enter your comment..."
                    className={styles.commentInput}/>
                
                <button onClick={sendComment} className={styles.sendButton} style={{background: 'None', border: 'None', fontSize: '20px'}}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                </button>
            </div>
            </div>
        </div></div>
    )
}

export default PostDetails;