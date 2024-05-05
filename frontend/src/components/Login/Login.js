import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

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
      const response = await axios.post('localhost:8080/login', formData);
      console.log(response.data);
      document.cookie = `user_id=${response.data.user_id}; path=localhost:8080/`;
      document.cookie = `username=${response.data.username}; path=localhost:8080/`;
      navigate('/');
    } catch (error) {
      setError(error.response.data.error || 'An error occurred');
    }
  };

  return (
    <div className={styles.login}>
      <h1 style={{ 'textAlign': 'center'}}>Login</h1>
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
      </form>
    </div>
  );
};

export default Login;
