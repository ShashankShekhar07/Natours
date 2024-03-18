// const dotenv = require('dotenv');
// const app = require('./app');
// const mongoose = require('mongoose');
// dotenv.config({ path: './config.env' });
// console.log(process.env.PORT)
// const DB = process.env.DATABASE.replace(
//     '<password>',
//     process.env.DATABASE_PASSWORD
//   );

// mongoose.connect(DB).then((res)=>{
//     console.log("Connection to DB successful!")
// })

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`App running on port ${port}...`);
// });

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const Tour= require('./models/tourModel')
process.on('uncaughtException',err => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
    process.exit(1);
});
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

  const port = process.env.PORT || 3000;

const server= app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection',err => {
    console.log(err.name,err.message);
    console.log('UNHANDLED REJECTION! Shutting down');
    server.close(()=>{
      process.exit(1);
    });
});

