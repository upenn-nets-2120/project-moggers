import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    affiliation: '',
    birthday: ''
  });
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
      for (const key in formData) {
        if (!formData[key]) {
          setError(`Please fill in ${key}`);
          return;
        }
      }
      
      const response = await axios.post('localhost:8080/register', formData);
      console.log(response.data);
      navigate('/login');
    } catch (error) {
      setError(error.response.data.error || 'An error occurred');
    }
  };

  return (
    <div className={styles.register}>
      <h1 style={{ 'textAlign': 'center'}}>Register</h1>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit} className={styles.registerform}>
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
        <button type="submit" className={styles.registerbtn}>Register</button>
      </form>
    </div>
  );
};

export default Register;
