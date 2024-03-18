// // const express = require('express');
// // const morgan = require('morgan');

// // const tourRouter = require('./routes/tourRoutes.js');
// // const userRouter = require('./routes/userRoutes.js');

// // const app = express();

// // // 1) MIDDLEWARES
// // if (process.env.NODE_ENV === 'development') {
// //   app.use(morgan('dev'));
// // }

// // app.use(express.json());
// // app.use(express.static(`${__dirname}/public`));

// // app.use((req, res, next) => {
// //   console.log('Hello from the middleware 👋');
// //   next();
// // });

// // app.use((req, res, next) => {
// //   req.requestTime = new Date().toISOString();
// //   next();
// // });

// // // 3) ROUTES
// // app.use('/api/v1/tours', tourRouter);
// // app.use('/api/v1/users', userRouter);

// // module.exports = app;

// const express = require('express');
// const morgan = require('morgan');
// const AppError = require('./utils/appError');
// const globalErrorHandler = require('./controllers/errorController.js')
// const tourRouter = require('./routes/tourRoutes');
// const userRouter = require('./routes/userRoutes');

// const app = express();

// // 1) MIDDLEWARES
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// app.use(express.json());
// app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('Hello from the middleware 👋');
//   next();
// });

// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

// // 3) ROUTES
// app.use('/api/v1/tours', tourRouter);
// app.use('/api/v1/users', userRouter);

// //This middleware is for all the left routes which are not of the above two .All function works for all elements like find,patch,update,delete
// app.all('*',(req,res,next) => {
//   // res.status(404).json({
//   //   status: 'fail',
//   //   message: `Can't find ${req.originalUrl} on this server!`
//   // });
//   next(new AppError (`Can;t find ${req.originalUrl} on this server!`,404));
//   // const err =new Error(`Can't find ${req.originalUrl} on this server!`);
//   // err.status = 'fail';
//   // err.statusCode = 404;

//   // next(err); //if this happens it will ignore all other middlewares and go for the final one
// });

// app.use(globalErrorHandler);

// module.exports = app;
const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  console.log('hi')
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;