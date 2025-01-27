import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const login = async (req, res) => {
    const { accessCode, role, username, password } = req.body;

    let user, token;
    try {
        if (role === 'Worker') {
            user = await User.findOne({ accessCode })
            if (!user) {
                return res.status(400).json({ message: 'Invalid access code' });
            }

            token = jwt.sign({ user: { id: user._id, role: user.role } }, process.env.JWT_SECRET);
        }

        if (role === 'Admin' || role === 'Manager') {
            user = await User.findOne({ username, role });

            if (!user) {
                return res.status(400).json({ message: 'user not found' });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            token = jwt.sign({ user: { id: user._id, role: user.role } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        }

        res.status(200).json({ success: true, token });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' });
    }
};