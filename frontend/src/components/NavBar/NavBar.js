import React, {useState, useEffect} from "react";
import { Link, useNavigate } from "react-router-dom";
import config from '../../serverConfig.json';
import ReactSession from "../../ReactSession";

const NavBar = () => {
  const [userId, setUserId] = useState(ReactSession.get("user_id"));
  const navigate = useNavigate();

  useEffect(() => {
    setUserId(ReactSession.get("user_id"));
  }, [userId]);

  const handleLogout = async () => {
    try {
      await fetch(`${config.serverRootURL}/logout`, {method: 'GET'});
      ReactSession.set("user_id", -1);
      ReactSession.set("username", "");
      navigate('/login');
      window.location.reload();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div>
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark" style={{position: 'fixed', width: '100%'}}>
      <div className="container">
        <Link className="navbar-brand" to="/">
          Moggerstagram
        </Link>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav">
            {userId !== -1 && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/">
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/chat">
                    Chat
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/changeProfile">
                    Update Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/friends">
                    Friends
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/post">
                    Post
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="nav-link" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            )}
            {userId === -1 && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">
                    Register
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
    <br></br><br></br></div>
  );
}

export default NavBar;
