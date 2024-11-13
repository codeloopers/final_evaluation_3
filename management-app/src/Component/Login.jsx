import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Lap from '../Images/lap.png';
import back from '../Images/Back.png';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Loader from '../Component/Loader'; 
import Eye from '../Images/eye.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
    const navigate = useNavigate();

    const validateInput = () => {
        if (!email) {
            setError('Email is required');
            return false;
        } else if (!password) {
            setError('Password is required');
            return false;
        } 
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateInput()) return;

        setLoading(true);

        try {
            const response = await fetch('https://final-evaluaion-3.onrender.com/Login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.userId);
                localStorage.setItem('email', data.email);
                localStorage.setItem('name', data.name);
                navigate('/dashboard');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="maincontainer">
            {loading ? (
                <Loader />
            ) : (
                <div className="login-container">
                    <div className="left-panel">
                        <div className="astronaut">
                            <img src={Lap} alt="" className='lap-image' />
                            <img src={back} alt="" className='back-image' />
                        </div>
                        <h2>Welcome aboard my friend</h2>
                        <p>Just a couple of clicks and we start</p>
                    </div>
                    <div className="right-panel">
                        <h1>Login</h1>
                        <form onSubmit={handleSubmit}>
                            <div className="input-container">
                                <FaEnvelope className="icon" />
                                <input
                                    className="input-text"
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="input-container">
                                <FaLock className="icon" />
                                <input
                                    className="input-text"
                                    type={showPassword ? "text" : "password"} // Toggle password visibility
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <img 
                                    src={Eye} 
                                    alt="Toggle Password Visibility" 
                                    className="eye" 
                                    onClick={() => setShowPassword(!showPassword)} // Toggle password visibility on click
                                />
                            </div>
                            {error && <p className="error-message">{error}</p>}
                            <button className='login-btn' type="submit">Log in</button>
                        </form>
                        <div className="register">
                            <p>Have no account yet? </p>
                            <Link to="/register" className="Register-btn">Register</Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
