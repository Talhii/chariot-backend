import Order from '../models/Order.js';
import Piece from '../models/Piece.js';
import Section from '../models/Section.js';
import User from '../models/User.js';
import Tesseract from "tesseract.js";

export const getPieceById = async (req, res) => {
  try {
    const { code, number } = req.params;
    const piece = await Piece.findOne({ code, number })
      .populate({
        path: 'currentSectionId',
        model: Section,
      }).populate({
        path: 'history.workerId',
        model: User,
      });

    if (!piece) {
      throw new Error('Piece not found');
    }

    res.status(200).json({
      status: 'success',
      data: piece
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

export const getOrders = async (req, res) => {
  try {
    const { sectionNumber } = req.query;

    const section = await Section.findOne({ number: sectionNumber }).lean();
    if (!section) {
      return res.status(404).json({
        status: 'fail',
        message: 'Section not found'
      });
    }

    const orders = await Order.find({ status: "InProgress" }).sort({ _id: -1 }).lean();
    const orderIds = orders.map(order => order._id);

    const [allCurrentPieces, allIncomingPieces, pieceCountsByCode] = await Promise.all([
      Piece.find({ status: "InProgress", orderId: { $in: orderIds }, currentSectionId: section._id })
        .populate('currentSectionId')
        .populate('history.workerId')
        .populate('history.section')
        .lean(),

      sectionNumber != 1
        ? Piece.find({
          status: "InProgress",
          orderId: { $in: orderIds },
          currentSectionId: { $in: await Section.find({ number: { $lt: sectionNumber } }).distinct('_id') },
        })
          .populate('currentSectionId')
          .populate('history.workerId')
          .populate('history.section')
          .lean()
        : [],

      Piece.aggregate([
        { $match: { status: "InProgress", orderId: { $in: orderIds } } },
        { $group: { _id: "$code", count: { $sum: 1 } } }
      ])
    ]);

    const pieceCountMap = new Map(pieceCountsByCode.map(({ _id, count }) => [_id, count]));
    const modifiedOrdersData = orders.map(order => {
      const currentPieces = allCurrentPieces.filter(piece => piece.orderId.toString() === order._id.toString());
      const inComingPieces = allIncomingPieces.filter(piece => piece.orderId.toString() === order._id.toString());

      const takeOffData = order.takeOffData
        .map(takeOff => {
          const pieceAdded = pieceCountMap.get(takeOff.code) || 0;
          const remainingPiece = takeOff.noOfPiece - pieceAdded;

          return { ...takeOff, remainingPiece };
        })
        .filter(takeOff => takeOff.remainingPiece !== 0);


      return { ...order, currentPieces, inComingPieces, takeOffData };
    });

    res.status(200).json({
      status: 'success',
      results: modifiedOrdersData.length,
      piecesCount: allCurrentPieces.length,
      data: modifiedOrdersData
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

export const upsertPieceDetail = async (req, res) => {
  const { pieceId, orderId } = req.query;
  const userId = req.user.id;
  const { sectionNumber, code } = req.body;

  try {
    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    let nextSection = await Section.findOne({ number: { $gt: sectionNumber } }).sort({ number: 1 });

    if (sectionNumber == 1) {
      // const { data: { text } } = await Tesseract.recognize(req.file.path, "eng");
      // let cleanedText = text.replace(/\s+/g, "").replace(/\\/g, "1");
      // let code = cleanedText.replace(/(K5|V5|S-KS|S-VS|S-K|S-V|V-S|K-S|S-MR)/g, match => ({
      //   "K5": "KS",
      //   "V5": "VS",
      //   "S-KS": "5-KS",
      //   "S-VS": "5-VS",
      //   "S-K": "5-K",
      //   "S-V": "5-V",
      //   "V-S": "V-5",
      //   "K-S": "K-5",
      //   "S-MR": "5-MR",
      // }[match]));

      if (!(code.includes('VS') || code.includes('KS'))) {
        nextSection = await Section.findOne({ number: 3 });
      }
      const order = await Order.findById(orderId);

      const pieceCodeCounts = await Piece.countDocuments({ orderId, code });
      const takeOffItem = order.takeOffData.find(item => item.code == code);

      if (takeOffItem?.noOfPiece == pieceCodeCounts) {
        return res.status(400).json({ status: 'complete', message: 'All pieces for this code are completed' });
      }

      const piece = await Piece.find({ orderId, code });
      const currentSection = await Section.findOne({ number: sectionNumber });
      let pieceNumber = 1;

      if (piece.length) {
        const maxPiece = await Piece.find({ orderId, code }).sort({ number: -1 }).limit(1);
        pieceNumber = maxPiece.length ? maxPiece[0].number + 1 : 1;
      }

      await Piece.create({
        orderId,
        number: pieceNumber,
        code,
        currentSectionId: nextSection._id,
        status: 'InProgress',
        history: {
          section: currentSection._id,
          workerId: userId,
          timestamp: new Date(),
          photoUrl,
        },
      });
    }
    else {
      const piece = await Piece.findById(pieceId).populate({
        path: 'currentSectionId',
        model: Section,
      });
      if (!piece) {
        throw new Error('Piece not found');
      }

      if (nextSection) {
        await Piece.findOneAndUpdate(
          { _id: pieceId },
          {
            $push: {
              history: {
                section: piece.currentSectionId._id,
                workerId: userId,
                timestamp: new Date(),
                photoUrl,
              },
            },
            $set: {
              currentSectionId: nextSection._id,
            },
          },
          { new: true }
        );
      } else {
        await Piece.findOneAndUpdate(
          { _id: pieceId },
          {
            $set: {
              status: 'Completed',
            },
          },
          { new: true }
        );
      }
    }

    res.status(200).json({
      status: 'success',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const flagPiece = async (req, res) => {
  try {
    const { id } = req.params;
    const piece = await Piece.findOne({ _id: id });

    if (!piece) {
      throw new Error('Piece not found');
    }

    await Piece.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          status: "Flagged"
        },
      },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: piece
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
}

