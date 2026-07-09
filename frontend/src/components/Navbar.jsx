import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [isAdmin, setIsAdmin] = useState(
    localStorage.getItem("isAdmin") === "true"
  );

  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || ""
  );

  useEffect(() => {
    const updateAuth = () => {
      setIsLoggedIn(
        localStorage.getItem("isLoggedIn") === "true"
      );

      setIsAdmin(
        localStorage.getItem("isAdmin") === "true"
      );

      setUserType(
        localStorage.getItem("userType") || ""
      );
    };

    updateAuth();

    const interval = setInterval(updateAuth, 300);

    return () => clearInterval(interval);
  }, []);

  const getProfilePath = () => {
    if (!isLoggedIn) {
      return "/login";
    }

    // Employee has priority
    if (userType === "employee") {
      return "/employee";
    }

    // Admin
    if (userType === "admin" || isAdmin) {
      return "/admin";
    }

    // Customer
    return "/profile";
  };

  return (
    <>
      <div className="top-bar">
        <Link to="/cart">
          Shopping Cart
        </Link>

        <h2>Entertainment Guild</h2>

        {isLoggedIn ? (
          <Link to={getProfilePath()}>
            Profile
          </Link>
        ) : (
          <Link to="/login">
            Login
          </Link>
        )}
      </div>

      <div className="menu-bar">
        <Link to="/">Home</Link>
        <Link to="/movies">Movies</Link>
        <Link to="/games">Games</Link>
        <Link to="/products">Books</Link>
      </div>
    </>
  );
}

export default Navbar;