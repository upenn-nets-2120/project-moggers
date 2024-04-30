import React from 'react';

const Chat = () => {
  return (
    <div>
      {/* Use an iframe to load the EJS file */}
      <iframe src="/chat.ejs" title="EJS Content" width="100%" height="500px" frameBorder="0"></iframe>
    </div>
  );
}

export default Chat;