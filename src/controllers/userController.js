import User from '../models/User.js';

export const createUser = async (req, res) => {
  try {
    const { userId, name, role, accessCode } = req.body;

    if (!userId || !name || !role || !accessCode) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const userExists = await User.findOne({ userId });
    if (userExists) {
      return res.status(400).json({ message: 'User with this ID already exists' });
    }

    const newUser = new User({ userId, name, role, accessCode });
    await newUser.save();
    return res.status(201).json({ message: 'User created successfully', data: newUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({ data: users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
