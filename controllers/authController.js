const { promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const signToken= id => {
    return jwt.sign({id: id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

exports.signup = catchAsync(async(req,res,next) => {
    // const newUser= await User.create(req.body);
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt
    })
    //jwt.sign(payload, secretOrPrivateKey, [options, callback])
    const token = signToken(newUser._id);
    
    res.status(201).json({
        status: 'success',
        token : token,
        data: {
            user: newUser
        }
    });
}); 

exports.login = catchAsync(async(req,res,next) => {
    const {email,password} = req.body;
    //1) Check if email and password exist
    if(!email || !password ){
        return next(new AppError('Please provide email and password!',400));
    }

    //2) Check if user exists && password is correct
    const user = await User.findOne({email: email}).select('+password');
    console.log(await user.correctPassword(password,user.password));

    if(!user || !(await user.correctPassword(password,user.password))){
        return next(new AppError('Incorrect email or password',401))
    }
    //3)If okay ,send token to client

    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token: token
    });

});
//this function checks if the user is logged in or not
exports.protect = catchAsync(async(req,res,next) => {
    //1) Getting token and check of it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token= req.headers.authorization.split(' ')[1];
    }

    // console.log(token);

    if(!token){
        return next(new AppError('You are not logged in! Please login to get access',401))
    }
    //2) Verification token
    //returns payload
    
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decoded.iat);
    //if logged in we will have token which has user id
    //3)Check if user still exists
    //So we have the jwt token which can be taken by a hacker and if the user id is deleted 
    //He can still access everything using token so we will again check for the user with that token
    const freshUser = await User.findById(decoded.id);
    // console.log(freshUser)
    if(!freshUser){
        return next(new AppError('The user belonging to this token does no longer exist.',401))
    }
    //4)Check if user changed password after the JWT was issued 
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again', 401))
    }
    //Grant access to protected route
    req.user = freshUser;
    next();
});