const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);
  // Tour.findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});
// const fs = require('fs');
// const APIFeatures = require('./../utils/apiFeatures')
// const catchAsync = require('./../utils/catchAsync');
// const Tour = require('./../models/tourModel.js');
// const AppError = require('./../utils/appError');
// //Aliasing
// exports.aliasTopTours = (req,res,next) => {
//   // try{
//     req.query.limit = '5';
//     req.query.sort= '-ratingsAverage,price';
//     req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
//     next();  
//   // }
//   // catch (err) {
//   //   res.status(404).json({
//   //     status: 'middleware fail',
//   //     message: err
//   //   });
//   // }
// };



// exports.getAllTours = catchAsync(async (req, res, next) => {

    
//     //EXECUTE QUERY

//     const features = new APIFeatures(Tour.find(),req.query).filter().sort().limitFields().paginate();
//     const tours= await features.query;
//     // const tours= await query;
    
//     // SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       results: tours.length,
//       data: {
//         tours
//       }
//     }); 
//   });


// exports.getTour = catchAsync(async (req, res,next) => {
//     const tour = await Tour.findById(req.params.id);
//     // Tour.findOne({ _id: req.params.id })
//     if(!tour){
//       return next(new AppError('No tour found with that ID',404))
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour
//       }
//     });
// });



// exports.createTour =catchAsync( async (req, res, next ) => {
//   const newTour = await Tour.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour
//     }
//   });
//   // try {
//   //   // const newTour = new Tour({})
//   //   // newTour.save()


//   // } catch (err) {
//   //   res.status(400).json({
//   //     status: 'fail',
//   //     message: err
//   //   });
//   // }
// });

// exports.updateTour = catchAsync(async (req, res,next) => {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//       new: true, //returns the updated tour 
//       runValidators: true
//     });

//     if(!tour){
//       return next(new AppError('No tour found with that ID',404))
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour
//       }
//     });

// });

// exports.deleteTour = catchAsync(async (req, res,next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if(!tour){
//       return next(new AppError('No tour found with that ID',404))
//     }
//     res.status(204).json({
//       status: 'success',
//       data: tour
//     });

// });

// exports.getTourStats= catchAsync(async(req,res,next) => {
//     const stats =await  Tour.aggregate([
//       {
//         $match:
//           {
//             ratingsAverage: {$gte : 4}
//           }      
//       },
//       {
//         $group: {
//           _id: { $toUpper : '$difficulty'},
//           // _id: '$ratingsAverage',
//           num: {$sum: 1},
//           numRatings: {$sum: '$ratingsQuantity'},
//           avgRating: {$avg: '$ratingsAverage'},
//           avgPrice: {$avg: '$price'},
//           minPrice: {$min: '$price'},
//           maxPrice: {$max: '$price'}, 
//         }
//       },
//       {
//         $sort: { avgPrice: 1 }
//       },
//       // {
//       //   $match: {_id: {$ne: 'EASY'}}
//       // }
//     ]);

//     res.status(200).json({
//       status: 'success',
//       data: {
//         stats
//       }
//     })
// });

// exports.getMonthlyPlan = catchAsync(async (req,res,next) => {
//     const year = req.params.year * 1;

//     const plan = await Tour.aggregate([{
//       $unwind: '$startDates'
//     },
//     {
//       $match: {
//         startDates: {
//           $gte: new Date(`${year}-01-01`),
//           $lte: new Date(`${year}-12-31`),
//         }
//       }
//     },
//     {
//       $group: {
//         _id: {$month: '$startDates'},
//         numTourStarts : {$sum: 1},
//         tours: {$push: '$name'}
//       }
//     },
//     {
//       $sort: {
//         numTourStarts : 1
//       }
//     },
//     {
//       $addFields: {month: '$_id'}
//     },
//     {
//       $project: {
//         _id: 0
//       }
//     },
//     // {
//     //   $limit: 6
//     // }
//   ]);

//     res.status(200).json({
//       status: 'success',
//       data: {        
//         plan
//       }
//     })
//   });

// // });
// // EXECUTE QUERY
//     // const features = new APIFeatures(Tour.find(), req.query)
//     //   .filter()
//     //   .sort()
//     //   .limitFields()
//     //   .paginate();

//     //BUILD QUERY
    
//         // console.log(req.query);
//     //{difficulty: 'easy', duration: {$gte : 5}}
//     //{ duration: { gte: '5' }, difficulty: 'easy' }
//     // const tours = await Tour.find({
//     //   // duration: 5,
//     //   difficulty: 'easy'
//     // });

//     // const tours= await Tour.find()
//     // .where('duration')
//     // .equals(5)
//     // .where('difficulty')
//     // .equals('easy');
//     // 1A)Filtering
//     // const queryObj = {...req.query};
//     // const excludedFields = ['page','sort','limit','fields'];
//     // excludedFields.forEach(el => delete queryObj[el])
    
//     // // console.log(req.query,queryObj);
//     // //we make it a query for using various methods like sort etc;
//     // //1B) Advanced Filetering
//     // let queryStr =  JSON.stringify(queryObj);
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g , match => `$${match}`);
//     // console.log(JSON.parse(queryStr));


//     // let query= Tour.find(JSON.parse(queryStr));
//     //2A)SORTING
    
//     // if(req.query.sort){
//     //   let sortBy = req.query.sort.split(',').join(' ');
//     //   // console.log(sortBy);
//     //   query=query.sort(sortBy)
//     //   //In mongoose you can sort using query.sort(price ratingsAverage)
//     // }
//     // else{
//     //   query=query.sort('-createdAt')
//     // }

//     //3) Field Limiting

//     // if(req.query.fields){
//     //   const fields= req.query.fields.split(',').join(' ');
//     //   console.log(fields);
//     //   query=query.select(fields);
//     // }
//     // else{
//     //   query= query.select('-__v');
//     // }

//     //4) Pagination
//     // const page=(req.query.page*1) || 1;
//     // const limit= req.query.limit*1 || 100;
//     // const skip = (page-1)*limit;
//     // //page=2&limit=10 1-10 page 1, 11-20 page2 
//     // query= query.skip(skip).limit(limit);
    
//     // if(req.query.page){
//     //   const numTours= await Tour.countDocuments();
//     //   if(skip>numTours){
//     //     throw new Error('This page does not exist');
//     //   }
//     // }
    
    
    