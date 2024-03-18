const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");

exports.getAllUsers = catchAsync(async(req, res,next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'BHagg!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

// exports.getAllUsers = (req, res) => {
//     res.status(500).json({
//       status: 'error',
//       message: 'This route is not yet defined!'
//     });
//   };
//   exports.getUser = (req, res) => {
//     res.status(500).json({
//       status: 'error',
//       message: 'This route is not yet defined!'
//     });
//   };
//   exports.createUser = (req, res) => {
//     res.status(500).json({
//       status: 'error',
//       message: 'This route is not yet defined!'
//     });
//   };
//   exports.updateUser = (req, res) => {
//     res.status(500).json({
//       status: 'error',
//       message: 'This route is not yet defined!'
//     });
//   };
//   exports.deleteUser = (req, res) => {
//     res.status(500).json({
//       status: 'error',
//       message: 'This route is not yet defined!'
//     });
//   };