# Moggerstram

# Team 
Our group number is 8 and we are called MOGGERS.
Names: Matthew Tsui (matsu), Ashley Zhang (ashzhang), Alicia Sun (asun0102), Kevin He (haokunhe)

## Overview
Moggerstram is the culmination of the collaborative efforts of Matthew Tsui, Ashley Zhang, Alicia Sun, and Kevin He from the University of Pennsylvania. This project introduces "InstaLite," a social media platform reminiscent of Instagram but with a unique blend of features and technologies. Leveraging a diverse technology stack including Node.js, Javascript, RDS, DynamoDB, ChromaDB, S3, Apache Kafka, Apache Spark, React, and JavaScript, managed through GitHub, Moggerstram offers users a dynamic and engaging social media experience.

Users of Moggerstram can sign up, log in, and personalize their profiles with profile photos and hashtags of interest. Notably, the platform employs facial recognition technology to link user accounts to actors on IMDB based on selfie embeddings. The core functionality includes a dynamic feed displaying user posts, comments, and relevant content based on friendships, hashtags, and course project streams. Additionally, Moggerstram facilitates federated post sharing through Kafka channels. Secondary features include profile management, friend interactions, chat functionality with persistence and scalability, and natural language search capabilities. Security measures ensure unauthorized access and content manipulation prevention, while scalability guarantees system resilience under increased user load.

#Instructions

In backend and frontend, run npm install
Set up the tunnel in the backend
Set up the ec2 for the kafka backend
Set up the chroma in the backend

Source Files
```
Backend:
models/create_tables.js
routes/routes.js
socialrank

Frontend:
ReactSession.js
index.js
App.js
Components/ChangeProfile
Components/Chat
Components/Friends
Components/Home
Components/Login
Components/Register
Components/NavBar
Components/Post
Components/Profile
Components/SearchBar
```
