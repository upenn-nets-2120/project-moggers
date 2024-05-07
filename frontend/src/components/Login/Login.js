import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import ReactSession from '../../ReactSession';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [cookies, setCookie] = useCookies(['user_id', 'username']);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      for (const key in formData) {
        if (!formData[key]) {
          setError(`Please fill in ${key}`);
          return;
        }
      }
      console.log(formData);
      console.log("jhghjjjjjjj");
      const response = await axios.post('http://localhost:8080/login', formData);
      console.log(response);
      // document.cookie = `user_id=${response.data.user_id}; path=http://localhost:8080/`;
      // document.cookie = `username=${response.data.username}; path=http://localhost:8080/`;
      ReactSession.set("user_id", response.data.user_id);
      ReactSession.set("username", response.data.username);
      console.log(ReactSession.get("user_id"));
      console.log(ReactSession.get("username"));
      navigate('/');
      window.location.reload();
    } catch (error) {
      console.log(error);
      setError( 'An error occurred');
    }
  };

  return (
    <div className={styles.body}>
    <div className={styles.login}>
      <h2 style={{ 'textAlign': 'center', marginTop: '10px'}}>Login</h2>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.loginform}>
        <div className={styles.formgroup}>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} />
        </div>
        <div className={styles.formgroup}>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
        </div>
        <button type="submit" className={styles.loginbtn}>Login</button>
        <p style={{ 'textAlign': 'center'}}>Don't have an account? <a href="/register">Sign up</a></p>
      </form>
    </div>
    </div>
  );
};

export default Login;
