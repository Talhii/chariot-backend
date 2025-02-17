import Order from '../models/Order.js';
import User from '../models/User.js';
import Section from '../models/Section.js';
import Piece from '../models/Piece.js';
import bcrypt from 'bcryptjs';
import fs from "fs"
import xlsx from 'xlsx';
import { csvToJson } from '../utils/csv-to-json.js';
import mongoose from 'mongoose';

export const getDashboardData = async (req, res) => {
    try {
        const currentDate = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(currentDate.getDate() - 7);

        const daysOfWeek = [
            { _id: 1, day: 'Sun' },
            { _id: 2, day: 'Mon' },
            { _id: 3, day: 'Tue' },
            { _id: 4, day: 'Wed' },
            { _id: 5, day: 'Thu' },
            { _id: 6, day: 'Fri' },
            { _id: 7, day: 'Sat' }
        ];

        const completedPiecesByDay = await Piece.aggregate([
            {
                $match: {
                    status: 'Completed',
                    updatedAt: { $gte: oneWeekAgo }
                }
            },
            {
                $project: {
                    updatedAt: 1,
                    dayOfWeek: {
                        $cond: {
                            if: { $gte: [{ $type: '$updatedAt' }, 'date'] },
                            then: { $dayOfWeek: '$updatedAt' },
                            else: null
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$dayOfWeek',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    day: {
                        $switch: {
                            branches: [
                                { case: { $eq: ['$_id', 1] }, then: 'Sun' },
                                { case: { $eq: ['$_id', 2] }, then: 'Mon' },
                                { case: { $eq: ['$_id', 3] }, then: 'Tue' },
                                { case: { $eq: ['$_id', 4] }, then: 'Wed' },
                                { case: { $eq: ['$_id', 5] }, then: 'Thu' },
                                { case: { $eq: ['$_id', 6] }, then: 'Fri' },
                                { case: { $eq: ['$_id', 7] }, then: 'Sat' }
                            ],
                            default: 'Unknown'
                        }
                    },
                    piecesCount: '$count'
                }
            }
        ]);

        const chartData = daysOfWeek.map(day => {
            const foundDay = completedPiecesByDay.find(item => item.day === day.day);
            return {
                day: day.day,
                piece: foundDay ? foundDay.piecesCount : 0
            };
        });

        const flaggedPieces = await Piece.find({ status: "Flagged" })
            .populate({
                path: 'history.workerId',
                model: User,
                select: 'fullName'
            })
            .populate({
                path: 'currentSectionId',
                model: Section,
            });

        const sections = await Section.aggregate([
            {
                $lookup: {
                    from: 'pieces',
                    localField: '_id',
                    foreignField: 'currentSectionId',
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
                $sort: { number: 1 }
            },
            {
                $group: {
                    _id: null,
                    sections: { $push: "$$ROOT" },
                    totalPieces: { $sum: "$pieceCount" }
                }
            },
            {
                $unwind: "$sections"
            },
            {
                $project: {
                    _id: "$sections._id",
                    name: "$sections.name",
                    number: "$sections.number",
                    pieceCount: "$sections.pieceCount",
                    totalPieces: 1
                }
            }
        ]);

        const orders = await Order.find({})
            .sort({ _id: -1 })
            .limit(5);

        const workers = await User.find({
            role: "Worker"
        })

        const pieceCount = await Piece.countDocuments();
        const flaggedPiecesCount = await Piece.countDocuments({ status: "Flagged" })
        const totalOrdersCount = await Order.countDocuments()
        const pendingOrdersCount = await Order.countDocuments({ status: "InProgress" })

        const data = {
            flaggedPieces,
            sections,
            orders,
            chartData,
            workers,
            counts: {
                pieceCount,
                flaggedPiecesCount,
                totalOrdersCount,
                pendingOrdersCount
            }
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
            path: 'section',
            model: Section,
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

        if (req.body.password && (req.body.role === 'Admin' || req.body.role === 'Manager')) {
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password, salt);
        }

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

        const orders = await Order.find(queryObj).sort({ _id: -1 }).skip(skip).limit(Limit);
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
            data: order
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
        let extractedData = [];
        let fileUrls = [];

        if (req.files.length > 0) {
            for (const file of req.files) {
                const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.mimetype === 'application/vnd.ms-excel') {
                    const workbook = xlsx.readFile(file.path);
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    if (sheet) {
                        const jsonData = xlsx.utils.sheet_to_json(sheet);
                        const headerRow = jsonData.find(row => Object.values(row).includes("CODE") && Object.values(row).includes("No. of Pc"));
                        if (headerRow) {
                            const codeKey = Object.keys(headerRow).find(key => headerRow[key] === "CODE");
                            const noOfPieceKey = Object.keys(headerRow).find(key => headerRow[key] === "No. of Pc");

                            const headerIndex = jsonData.indexOf(headerRow);
                            const dataRows = jsonData.slice(headerIndex + 1);

                            extractedData = dataRows.map(row => ({
                                code: row[codeKey] ? row[codeKey].replace(/\s+/g, "") : "",
                                noOfPiece: row[noOfPieceKey]
                            })).filter(item => item.code && item.noOfPiece);
                        }
                    }
                    fs.unlinkSync(file.path);
                } else {
                    fileUrls.push({ url: fileUrl });
                }
            }

            req.body.drawings = fileUrls;
            req.body.takeOffData = extractedData;
            req.body.status = "InProgress";

            const newOrder = await Order.create(req.body);

            res.status(201).json({
                status: 'success',
                data: newOrder
            });
        }
    } catch (err) {
        console.log({ err });
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const updateOrder = async (req, res) => {
    try {
        if (req.files.length > 0) {
            const imageUrls = req.files.map((file) => {
                const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                return { url: photoUrl, };
            });

            req.body.drawings = imageUrls;
        }
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
            data: order
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

//Sections
export const createSection = async (req, res) => {
    try {
        const sectionAlreadyExists = await Section.findOne({
            number: req.body.number
        });

        if (sectionAlreadyExists) {
            return res.status(400).json({
                status: 'fail',
                message: 'Section with that number already exists'
            });
        }
        const newSection = await Section.create(req.body);
        res.status(201).json({
            status: 'success',
            data: newSection
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const getAllSections = async (req, res) => {
    try {
        const sections = await Section.find().sort({ number: 1 });
        res.status(200).json({
            status: 'success',
            data: sections
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const getSection = async (req, res) => {
    try {
        const section = await Section.findById(req.params.id);
        if (!section) {
            return res.status(404).json({
                status: 'fail',
                message: 'No section found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: section
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const updateSection = async (req, res) => {
    try {
        const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!section) {
            return res.status(404).json({
                status: 'fail',
                message: 'No section found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: section
        });
    }
    catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}

export const deleteSection = async (req, res) => {
    try {
        const section = await Section.findByIdAndDelete(req.params.id);
        if (!section) {
            return res.status(404).json({
                status: 'fail',
                message: 'No section found with that ID'
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

export const assignSectionToWorker = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'No user found with that ID'
            });
        }
        const section = await Section.findById(req.params.sectionId);
        if (!section) {
            return res.status(404).json({
                status: 'fail',
                message: 'No section found with that ID'
            });
        }
        user.section = section._id;
        await user.save();
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
}


//Pieces
export const createPiece = async (req, res) => {
    try {
        const section = await Section.find().sort({ number: 1 }).limit(1);
        req.body.currentSectionId = section[0]._id

        req.body.history = []
        const newPiece = await Piece.create(req.body);
        res.status(201).json({
            status: 'success',
            data: newPiece
        });
    } catch (err) {
        console.log({ err })
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const updatePiece = async (req, res) => {
    try {
        const piece = await Piece.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!piece) {
            return res.status(404).json({
                status: 'fail',
                message: 'No Piece found with that ID'
            });
        }
        res.status(200).json({
            status: 'success',
            data: piece
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

export const getPiece = async (req, res) => {
    try {
        const piece = await Piece.findById(req.params.id).populate({
            path: 'currentSectionId',
            model: Section,
        }).populate({
            path: 'history.workerId',
            model: User,
        }).populate({
            path: 'history.section',
            model: Section,
        });

        res.status(200).json({
            status: 'success',
            data: piece
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
}


export const getAllPieces = async (req, res) => {
    try {
        const Page = req.query.page * 1 || 1;
        const Limit = req.query.limit * 1 || 10;

        const skip = (Page - 1) * Limit;
        const query = req.query;
        const queryObj = { ...query };

        const pieces = await Piece.find(queryObj).sort({ _id: -1 }).skip(skip).limit(Limit).populate({
            path: 'currentSectionId',
            model: Section,
            select: "name"
        }).populate({
            path: 'orderId',
            model: Order,
            select: "projectName"
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

export const getPieceProgress = async (req, res) => {
    try {
        const Page = req.query.page * 1 || 1;
        const Limit = req.query.limit * 1 || 10;
        const skip = (Page - 1) * Limit;

        let filter = {};

        if (req.query.date) {
            const startDate = new Date(req.query.date);
            const endDate = new Date(req.query.date);
            endDate.setHours(23, 59, 59, 999);

            filter["history.timestamp"] = {
                $gte: startDate,
                $lte: endDate
            };
        }

        if (req.query.section && mongoose.Types.ObjectId.isValid(req.query.section)) {
            filter["history.section"] = new mongoose.Types.ObjectId(req.query.section);
        }

        if (req.query.worker && mongoose.Types.ObjectId.isValid(req.query.worker)) {
            filter["history.workerId"] = new mongoose.Types.ObjectId(req.query.worker);
        }

        const pieces = await Piece.find(filter)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(Limit)
            .populate({
                path: 'currentSectionId',
                model: Section,
                select: "name"
            })
            .populate({
                path: 'orderId',
                model: Order,
                select: "projectName"
            })
            .populate({
                path: 'history.workerId',
                model: User,
                select: "fullName"
            })
            .populate({
                path: 'history.section',
                model: Section,
                select: "name"
            });

        const pieceCount = await Piece.countDocuments(filter);

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
};

export const getPiecesGroupbySection = async (req, res) => {
    try {
        const pieces = await Piece.aggregate([
            {
                $group: {
                    _id: '$currentSectionId',
                    count: { $sum: 1 }
                }
            }
        ]);
        res.status(200).json({
            status: 'success',
            results: pieces.length,
            data: pieces
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
            data: pieces
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
        piece.status = "InProgress";
        await piece.save();
        res.status(200).json({
            status: 'success',
            data: piece
        });
    } catch (err) {
        console.log({ err })
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