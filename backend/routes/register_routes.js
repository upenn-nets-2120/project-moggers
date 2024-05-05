const routes = require('./routes.js');

module.exports = {
    register_routes
}

function register_routes(app) {
    app.get('/register', routes.get_register);
    app.post('/login', routes.post_login);
    app.post('/logout', routes.post_logout); 
    // app.get('/getMessages', routes.get_register);
    // app.post('/postMessage', routes.post_logout); 
   
    // TODO: register getMovie, which does not need a :username
    //       Make it compatible with the call from ChatInterface.tsx
  }
  