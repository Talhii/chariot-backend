import Order from '../models/Order.js';
import User from '../models/User.js';
import Stage from '../models/Stage.js';
import Piece from '../models/Piece.js';
import bcrypt from 'bcryptjs';


//Users
export const getAllUsers = async (req, res) => {
    try {
        const { name, role } = req.query;
        let where = {};
        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 10;

        const skip = (page - 1) * limit;

        if (name) {
            where.name = { $regex: name, $options: 'i' };
        }

        if (role) {
            where.role = role;
        }

        const users = await User.find(where).skip(skip).limit(limit).sort({ _id: -1 });
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: users
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'No user found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const createUser = async (req, res) => {
    try {
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        req.body.photoUrl = photoUrl;

        if(req.body.role === 'Admin' || req.body.role === 'Manager') {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

        const newUser = await User.create(req.body);
        res.status(201).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {

        console.log(req.body)
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'No user found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: user
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'No user found with that ID'
            });
        }
        res.status(204).json({
            status: 'success',
            message: 'User deleted successfully',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};



//Orders
export const getAllOrders = async (req, res) => {
    try {
        const Page = req.query.page * 1 || 1;
        const Limit = req.query.limit * 1 || 10;

        const skip = (Page - 1) * Limit;
        const query = req.query;
        const queryObj = { ...query };

        const orders = await Order.find(queryObj).skip(skip).limit(Limit);
        res.status(200).json({
            status: 'success',
            results: orders.length,
            data: {
                orders
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'No order found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const createOrder = async (req, res) => {
    try {
        const newOrder = await Order.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                order: newOrder
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'No order found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                order
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({
                status: 'fail',
                message: 'No order found with that ID'
            });
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};



//Stages
export const createStage = async (req, res) => {
    try {
        const newStage = await Stage.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                stage: newStage
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const getAllStages = async (req, res) => {
    try {
        const stages = await Stage.find();
        res.status(200).json({
            status: 'success',
            results: stages.length,
            data: {
                stages
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const getStage = async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.id);
        if (!stage) {
            return res.status(404).json({
                status: 'fail',
                message: 'No stage found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                stage
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const updateStage = async (req, res) => {
    try {
        const stage = await Stage.findByIdAndUpdate

            (req.params.id, req.body, {
                new: true,
                runValidators: true
            });
        if (!stage) {
            return res.status(404).json({
                status: 'fail',
                message: 'No stage found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: {
                stage
            }
        });
    }
    catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const deleteStage = async (req, res) => {
    try {
        const stage = await Stage.findByIdAndDelete(req.params.id);
        if (!stage) {
            return res.status(404).json({
                status: 'fail',
                message: 'No stage found with that ID'
            });
        }
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const assignStageToWorker = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'No user found with that ID'
            });
        }
        const stage = await Stage.findById(req.params.stageId);
        if (!stage) {
            return res.status(404).json({
                status: 'fail',
                message: 'No stage found with that ID'
            });
        }
        user.stage = stage._id;
        await user.save();
        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}



//Pieces
export const getAllPieces = async (req, res) => {
    try {
        const Page = req.query.page * 1 || 1;
        const Limit = req.query.limit * 1 || 10;

        const skip = (Page - 1) * Limit;
        const query = req.query;
        const queryObj = { ...query };

        const pieces = await Piece.find(queryObj).skip(skip).limit(Limit).populate({
            path: 'currentStage',
            model: Stage,
            as: 'currentStage'
        }).populate({
            path: 'orderId',
            model: Order,
            as: 'order'
        })

        const pieceCount = await Piece.countDocuments(queryObj);

        res.status(200).json({
            status: 'success',
            results: pieceCount,
            data: pieces
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const getPiecesGroupbyStage = async (req, res) => {
    try {
        const pieces = await Piece.aggregate([
            {
                $group: {
                    _id: '$currentStage',
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json({
            status: 'success',
            results: pieces.length,
            data: {
                pieces
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const getFlaggedPieces = async (req, res) => {
    try {
        const pieces = await Piece.find({ flagged: true });
        res.status(200).json({
            status: 'success',
            results: pieces.length,
            data: {
                pieces
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const resolveFlaggedPiece = async (req, res) => {
    try {
        const piece = await Piece.findById(req.params.id);
        if (!piece) {
            return res.status(404).json({
                status: 'fail',
                message: 'No piece found with that ID'
            });
        }
        piece.flagged = false;
        await piece.save();
        res.status(200).json({
            status: 'success',
            data: {
                piece
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}




