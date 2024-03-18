// const AppError = require('./../utils/appError');

// const handleCastErrorDB = err =>{
//   const message = `Invalid ${err.path}: ${err.value}`
//   return new AppError(message,400);
// }

// const sendErrorDev = (err,res) => {
//   res.status(err.statusCode).json({
//     status: err.status,
//     error: err,
//     message: err.message,
//     stack: err.stack
//   });
// }

// const sendErrorProd = (err,res) => {
// //Operational,trusted error : send message to client
//   if(err.isOperational){
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//     });
//   }
//   //Programming or other unknown error: don't leak error details 
//   else{
//     //1)Log error
//     console.error('ERROR ha ha',err);
//     //2)Send Generic message
//     res.status(500).json({
//       status: 'error',
//       message: 'Something went very wrong!'
//     })
//   }

// }

// module.exports= (err,req,res,next) => {
//     // console.log(err.stack);
  
//     err.statusCode = err.statusCode||500;
//     err.status = err.status || 'error';

//     if(process.env.NODE_ENV === 'development'){
//       sendErrorDev(err,res);
//     }
//     else if(process.env.NODE_ENV === 'production'){
//       let error = {...err};

//       if(error.name === 'CastError') error = handleCastErrorDB(error);
//       sendErrorProd(error,res);
//     }  
// }

const AppError = require('./../utils/appError.js');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please login again',401)
}

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired! Please log in again',401);
}

const handleDuplicateFieldsDB = (err) => {

  // Extract the duplicate value using regular expression
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error('ERROR 💥',err);

    // 2) Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } 
  else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // console.log(err.code);
    // if (err.code === 11000) console.log("shashank");
    // console.log(err.name);
    console.log(err.message);
    if(err.name === 'TokenExpiredError ') console.log('HELLO')
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.name === 'MongoError') error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if(err.name === 'JsonWebTokenError') error = handleJWTError();
    if(err.name === 'TokenExpiredError') { error= handleJWTExpiredError()};
    sendErrorProd(error, res);
  }
};