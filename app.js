const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const helmet =require('helmet');
const app = express();
const mongoSanitize = require('express-mongo-sanitize');
const zss= require('xss-clean');
// 1) GLOBAL MIDDLEWARES
//Set security HTTP headers
app.use(helmet())
//Development logginf
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//npm i express-rate-limit
const limiter = rateLimit({
  max: 100,
  windowsMs: 60*60*1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);
// app.use(helmet())
//Body parser, reading data from body into req.body
app.use(express.json({limit: '10kb'}));

//Data sanitization agianst NOSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());




//Serving static files
app.use(express.static(`${__dirname}/public`));
//Test middleware
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