import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import config from '../../serverConfig.json';
import ReactSession from '../../ReactSession';
import styles from './PostDetails.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComment } from '@fortawesome/free-regular-svg-icons'
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons'
import { faReply } from '@fortawesome/free-solid-svg-icons'

function PostDetails({ post, onClose }) {
    const [comments, setComments] = useState({});
    const [commentThreads, setCommentThreads] = useState({});
    const [comment, setComment] = useState('');
    const [parentComment, setParentComment] = useState(null);
    const [liked, setLiked] = useState(post.hasLiked);
    var currUserId = ReactSession.get("user_id");
    const containerRef = useRef(null);

    useEffect(() => {
        handleGetComments(post.id);
    }, []);

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const sendComment = async () => {
        try {
            console.log(parentComment);
            let response;
            if (parentComment !== null) {
                response = await axios.post(`${config.serverRootURL}/sendComment`, {
                    post_id: post.id,
                    parent_post: parentComment.comment_id,
                    author: ReactSession.get("user_id"),
                    content: comment
                });
            } else {
                response = await axios.post(`${config.serverRootURL}/sendComment`, {
                    post_id: post.id,
                    parent_post: null,
                    author: ReactSession.get("user_id"),
                    content: comment
                });
            }
            console.log(response.data.message);
        } catch (error) {
            console.error('Error sending comment:', error);
        }
        setParentComment(null);
        setComment('');
        handleGetComments(post.id);
        if (containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    };

    const toggleLike = async (postId, hasLiked) => {
        const endpoint = hasLiked ? '/removeLike' : '/addLike';
        try {
          console.log(postId, currUserId, endpoint);
          var likeRes = await axios.post(`${config.serverRootURL}${endpoint}`, {
            post_id: postId,
            user_id: currUserId
          });
          console.log(likeRes);
          
          if (endpoint === '/addLike') {
            post.hasLiked = true;
            setLiked(true);
            post.like_count += 1;
          } else {
            post.hasLiked = false;
            setLiked(false);
            post.like_count -= 1;
          }
        } catch (error) {
          console.error('Error toggling like:', error);
        }
      };

    const handleGetComments = async (postId) => {
        try {
            const response = await axios.get(`${config.serverRootURL}/getComments`, { params: { postId } });
            const commentsData = response.data.data;
            setComments({ ...comments, [postId]: commentsData });

            const commentThreadsData = await Promise.all(commentsData.map(async (comment) => {
                try {
                    const threadResponse = await axios.get(`${config.serverRootURL}/getCommentThreads`, { params: { postCommentId: comment.comment_id } });
                    return threadResponse.data.data;
                } catch (error) {
                    console.error('Error fetching comment threads:', error);
                    return [];
                }
            }));
            console.log(commentThreadsData);
            if (commentThreadsData.length > 0) {
                const commentThreads = commentThreadsData.reduce((acc, threadData, index) => {
                    const parentCommentId = commentsData[index].comment_id;
                    acc[parentCommentId] = threadData;
                    return acc;
                }, {});
                setCommentThreads({ ...commentThreads, [postId]: commentThreads });
            }
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
    };

    return (
        <div className={styles.overlay}>
        <div className={styles.popup}>
        <div ref={containerRef} className={styles.postDetails}>
            <button style={{marginBottom: '5px', background: 'None', border: 'None', color: 'grey', fontSize: '20px', position: 'absolute' }} onClick={onClose}><b>X</b></button>
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
                  <button className={liked ? styles.likedHeart : styles.heart} 
                      onClick={() => toggleLike(post.id, post.hasLiked)}>
                      {post.hasLiked ? '♥' : '♡'} {post.like_count}
                  </button>
                  <p className={styles.comment}>
                  <FontAwesomeIcon icon={faComment} />
                  </p>
                </div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
              </div>
            {comments[post.id] && comments[post.id].length > 0 && (
                  comments[post.id].map(comment => (
                    <div key={comment.comment_id} className={styles.comment}>
                        <div className={styles.userInfo}>
                            <img
                                src={comment.author_profile_photo || "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"}
                                alt="Profile pic"
                                className={styles.commentProfilePic}
                            />
                            <div className={styles.commentContent}>
                                <div style={{marginBottom: '0px'}}>
                                    <p style={{fontSize: '15px', marginBottom: '0'}}><b>{comment.author_username}</b> {new Date(comment.timestamp).toLocaleDateString()}</p>
                                    <p style={{fontSize: '17px', marginTop: '5px'}}>{comment.content}</p>
                                </div>
                                <button 
                                    className={styles.replyButton} 
                                    onClick={() => {
                                        setParentComment(comment); 
                                        setComment(`@${comment.author_username} `);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faReply} />
                                </button>
                            </div>
                        </div>
                        <hr style={{marginBottom: '5px', marginTop: '0px'}}></hr>
                        {commentThreads[post.id] && commentThreads[post.id][comment.comment_id] && (
                            commentThreads[post.id][comment.comment_id].map(thread => (
                                <div key={thread.comment_id} className={styles.commentThread}>
                                    <div className={styles.userInfo}>
                                        <img
                                            src={thread.author_profile_photo || "https://www.pngitem.com/pimgs/m/146-1468479_my-profile-icon-blank-profile-picture-circle-hd.png"}
                                            alt="Profile pic"
                                            className={styles.commentProfilePic}
                                        />
                                        <div className={styles.commentContent}>
                                            <div style={{marginBottom: '0px'}}>
                                                <p style={{fontSize: '15px', marginBottom: '0'}}><b>{thread.author_username}</b> {new Date(thread.timestamp).toLocaleDateString()}</p>
                                                <p style={{fontSize: '17px', marginTop: '5px'}}>{thread.content}</p>
                                            </div>
                                            <button 
                                                className={styles.replyButton} 
                                                onClick={() => {
                                                    setParentComment(thread); 
                                                    setComment(`@${thread.author_username} `);
                                                }}>
                                                <FontAwesomeIcon icon={faReply} />
                                            </button>
                                        </div>
                                    </div>
                                    <hr style={{marginBottom: '5px', marginTop: '0px', color: 'gray'}}></hr>
                                </div>
                            ))
                        )}
                    </div>
                ))
            )}
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