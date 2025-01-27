import Order from '../models/Order.js';
import User from '../models/User.js';
import Stage from '../models/Stage.js';
import Piece from '../models/Piece.js';
import bcrypt from 'bcryptjs';


export const getDashboardData = async (req, res) => {
    try {

        const currentDate = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        // const completedPiecesByDay = await Piece.aggregate([
        //     {
        //         $match: {
        //             status: 'Completed',
        //             updatedAt: { $gte: oneWeekAgo }  // Filter completed pieces within the last week
        //         }
        //     },
        //     {
        //         $project: {
        //             dayOfWeek: {
        //                 $cond: {
        //                     if: { $gte: [{ $type: '$updatedAt' }, 'date'] }, // Check if updatedAt is a valid date
        //                     then: { $dayOfWeek: '$updatedAt' },
        //                     else: null  // If updatedAt is invalid, set as null
        //                 }
        //             },
        //             piecesCount: 1  // Keep the count field
        //         }
        //     },
        //     {
        //         $group: {
        //             _id: '$dayOfWeek',  // Group by the day of the week
        //             count: { $sum: 1 }  // Count how many pieces per day
        //         }
        //     },
        //     {
        //         $sort: { _id: 1 }  // Sort by day of the week (1 - Sunday, 7 - Saturday)
        //     },
        //     {
        //         $project: {
        //             day: {
        //                 $switch: {  // Convert day of week number to day name
        //                     branches: [
        //                         { case: { $eq: ['$dayOfWeek', 1] }, then: 'Sun' },
        //                         { case: { $eq: ['$dayOfWeek', 2] }, then: 'Mon' },
        //                         { case: { $eq: ['$dayOfWeek', 3] }, then: 'Tue' },
        //                         { case: { $eq: ['$dayOfWeek', 4] }, then: 'Wed' },
        //                         { case: { $eq: ['$dayOfWeek', 5] }, then: 'Thu' },
        //                         { case: { $eq: ['$dayOfWeek', 6] }, then: 'Fri' },
        //                         { case: { $eq: ['$dayOfWeek', 7] }, then: 'Sat' }
        //                     ],
        //                     default: 'Unknown'
        //                 }
        //             },
        //             piecesCount: '$count'  // The count of pieces per day
        //         }
        //     }
        // ]);
        // const result = completedPiecesByDay.map(item => ({
        //     day: item.day,
        //     piecesCount: item.piecesCount
        // }));

        // console.log(result);

        const flaggedPieces = await Piece.find({ flagged: true })
            .select('_id history')
            .populate({
                path: 'history.workerId',
                model: User,
                select: 'fullName'
            })
            .lean();

        const flaggedPiecesData = flaggedPieces.map(piece => {
            const flaggedHistory = piece.history.filter(entry => entry.flagged === true);

            return flaggedHistory.map(entry => ({
                _id: piece._id,
                worker: entry.workerId?.fullName,
                issue: entry.notes
            }));
        }).flat();

        const stages = await Stage.aggregate([
            {
                $lookup: {
                    from: 'pieces',
                    localField: '_id',
                    foreignField: 'currentStage',
                    as: 'pieces'
                }
            },
            {
                $addFields: {
                    pieceCount: { $size: { $ifNull: ['$pieces', []] } }
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    number: 1,
                    pieceCount: 1
                }
            },
            {
                $group: {
                    _id: null,
                    stages: { $push: "$$ROOT" },
                    totalPieces: { $sum: "$pieceCount" }
                }
            },
            {
                $unwind: "$stages"
            },
            {
                $project: {
                    _id: "$stages._id",
                    name: "$stages.name",
                    number: "$stages.number",
                    pieceCount: "$stages.pieceCount",
                    totalPieces: 1
                }
            }
        ]);


        const orders = await Order.find({})
            .sort({ _id: -1 })
            .limit(5);


        const data = {
            flaggedPieces: flaggedPiecesData,
            stages,
            orders,
            chartData: [
                { day: "Mon", piece: 186 },
                { day: "Tue", piece: 305 },
                { day: "Wed", piece: 237 },
                { day: "Thur", piece: 237 },
                { day: "Fri", piece: 73 },
                { day: "Sat", piece: 209 },
                { day: "Sun", piece: 214 },
            ]
        }

        res.status(200).json({
            status: 'success',
            data
        });


    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

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
        const user = await User.findById(req.params.id).populate({
            path: 'stage',
            model: Stage,
            as: 'stage'
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

export const createUser = async (req, res) => {
    try {
        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        req.body.photoUrl = photoUrl;

        if (req.body.role === 'Admin' || req.body.role === 'Manager') {
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
        const updateData = {};

        if (req.file) {
            const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
            updateData.photoUrl = photoUrl;
        }

        // Update other user fields from request body
        Object.assign(updateData, req.body);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'No user found with that ID',
            });
        }

        res.status(200).json({
            status: 'success',
            data: user,
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
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
        res.status(200).json({
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
            data: orders
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
        res.status(200).json({
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

        const stageAlreadyExists = await Stage.findOne({
            number: req.body.number
        });

        if (stageAlreadyExists) {
            return res.status(400).json({
                status: 'fail',
                message: 'Stage with that number already exists'
            });
        }
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
            data: stages
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
            data: stage
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
        res.status(200).json({
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

export const deletePiece = async (req, res) => {
    try {
        const piece = await Piece.findByIdAndDelete(req.params.id);
        if (!piece) {
            return res.status(404).json({
                status: 'fail',
                message: 'No piece found with that ID'
            });
        }
        res.status(200).json({
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




