import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Setting.css';
import Eye from '../Images/eye.png';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import axios from 'axios';

const Setting = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        setName(localStorage.getItem('name') || '');
        setEmail(localStorage.getItem('email') || '');
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
    
        if (!token) {
            setMessage({ text: 'You need to log in to update your settings.', type: 'error' });
            return;
        }
    
        const fieldsFilled = [
            name ? 'name' : null,
            email ? 'email' : null,
            (oldPassword && newPassword) ? 'password' : null,
        ].filter(Boolean);
    
        if (fieldsFilled.length > 1) {
            setMessage({ text: 'Please update only one field at a time.', type: 'error' });
            return;
        }
    
        if (!name && !email && !oldPassword && !newPassword) {
            setMessage({ text: 'At least one field is required for update.', type: 'error' });
            return;
        }
        if (oldPassword && !newPassword) {
            setMessage({ text: 'Please enter a new password to change your password.', type: 'error' });
            return;
        }
        if (newPassword && !oldPassword) {
            setMessage({ text: 'Please enter your old password to set a new password.', type: 'error' });
            return;
        }
    
        const updates = {};
        if (name !== localStorage.getItem('name')) updates.name = name;
        if (email !== localStorage.getItem('email')) updates.email = email;
        if (oldPassword && newPassword) {
            updates.oldPassword = oldPassword;
            updates.newPassword = newPassword;
        }
    
        try {
            const response = await axios.put('https://final-evaluaion-3.onrender.com/api/updateSettings', updates, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            console.log('Update successful:', response.data);
            
            if (updates.email || updates.newPassword) {
                localStorage.clear();
                navigate('/login');
            } else {
                if (updates.name) {
                    localStorage.setItem('name', updates.name);
                }
                if (updates.email) {
                    localStorage.setItem('email', updates.email);
                }
                setMessage({ text: 'Settings updated successfully!', type: 'success' });
            }

            setOldPassword('');
            setNewPassword('');
        } catch (error) {
            console.error('Error updating settings:', error.response ? error.response.data : error.message);
            setMessage({ text: 'Failed to update settings. Please try again later.', type: 'error' });
        }
    };
    
    return (
        <div className="main-setting">
            <h2>Settings</h2>
            <form onSubmit={handleUpdate}>
                <div className="input-container">
                    <FaUser className="icon" />
                    <input
                        className="input-text"
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="input-container">
                    <FaEnvelope className="icon" />
                    <input
                        className="input-text"
                        type="email"
                        placeholder="Update Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="input-container">
                    <FaLock className="icon" />
                    <input
                        className="input-text"
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Old Password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <img 
                        src={Eye} 
                        alt="Toggle Old Password Visibility" 
                        className="eye" 
                        onClick={() => setShowOldPassword(!showOldPassword)} 
                    />
                </div>
                <div className="input-container">
                    <FaLock className="icon" />
                    <input
                        className="input-text"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <img 
                        src={Eye} 
                        alt="Toggle New Password Visibility" 
                        className="eye" 
                        onClick={() => setShowNewPassword(!showNewPassword)} 
                    />
                </div>
                {message.text && (
                    <p className={`message ${message.type}`}>{message.text}</p>
                )}
                <button className='register-btn' type="submit">Update</button>
            </form>
        </div>
    );
};

export default Setting;
