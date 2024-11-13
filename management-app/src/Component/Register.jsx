import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import Lap from '../Images/lap.png';
import back from '../Images/Back.png';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Eye from '../Images/eye.png';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password
    const navigate = useNavigate();

    const validateInput = () => {
        if (!name) {
            setError('Name is required');
            return false;
        } else if (!email) {
            setError('Email is required');
            return false;
        } else if (!password) {
            setError('Password is required');
            return false;
        } else if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        } else if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateInput()) return;

        try {
            const response = await fetch('https://final-evaluaion-3.onrender.com/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/login');
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <div className="maincontainer">
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
                    <h2>Register</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-container">
                            <FaUser className="icon" />
                            <input
                                className="input-text"
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-container">
                            <FaEnvelope className="icon" />
                            <input
                                className="input-text"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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
                                required
                            />
                            <img
                                src={Eye}
                                alt="Toggle Password Visibility"
                                className="eye"
                                onClick={() => setShowPassword(!showPassword)} // Toggle password visibility on click
                            />
                        </div>
                        <div className="input-container">
                            <FaLock className="icon" />
                            <input
                                className="input-text"
                                type={showConfirmPassword ? "text" : "password"} // Toggle confirm password visibility
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <img
                                src={Eye}
                                alt="Toggle Confirm Password Visibility"
                                className="eye"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)} // Toggle confirm password visibility on click
                            />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                        <button className='register-btn' type="submit">Register</button>
                    </form>
                    <div className="register">
                        <p>Have an account? </p>
                        <Link to="/login" className="Register-btn">Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
