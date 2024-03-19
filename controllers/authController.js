const { promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto =require('crypto');
const signToken= id => {
    return jwt.sign({id: id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}
const createSendToken = (user,statusCode,res) => {
    const token =signToken(user._id);
    const options = {
        expires: new Date(Date.now()+ process.env.JWT_COOKIE_EXPIRES_IN*24*60*60*1000),
        httpsOnly : true, //For crossfit attack
    }   
    if(process.env.NODE_ENV=== 'production' ){
        options.secure= true;
    }

    res.cookie('jwt',token,options);
    //Remove password from output
    user.password= undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async(req,res,next) => {
    // const newUser= await User.create(req.body);
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    })
    //jwt.sign(payload, secretOrPrivateKey, [options, callback])
    createSendToken(newUser,201,res);
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

    createSendToken(user,200,res);

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

exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        // Roles is an array with ['admin', 'lead-guide'], role='user'
        if(!roles.includes(req.user.role)){
            return next(new AppError("You do not have permission for this task",403));
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    //1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        return next(new AppError('There is no user with email address', 404))
    }
    //2) Generate the random reset token (generated as instance method in model)
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false }) //we need to save this token to database but we dont need to validate it so we use this
    //3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}` //this is the url that will be sent to user
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!` //this is the message that will be sent to user
    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        })
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        })
    }
    catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false }) //above only modifies the data, this save actually saves it to database
        return next(new AppError('There was an error sending the email. Try again later!', 500))
    }
})


exports.resetPassword = catchAsync(async (req,res,next) => { //INPUT TOKEN and you will change the password
    //1) Get user based on the token
        const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {$gt: Date.now()}}
        )

        if(!user){
            throw next(new AppError('Token is invalid or has expired',400))
        }
 //2) If token has not expired, and there is user, set the new password
        user.password = req.body.password;
        user.passwordConfirm= req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
   
    //3) Update changePasswordAt property for the user
    //4) Log the user in, send JWT
    createSendToken(user,200,res);

})

exports.updatePassword = catchAsync(async(req,res,next) => {
    //Update password when you are logged in
    //1) Get user from the collection
    const user = await User.findById(req.user.id).select('+password');
    //2) Check if the posted password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent,user.password))){
        return next( new AppError('Your curret password is wrong.',401))
    }
    //3) If the password is correct, update the password
    //Cannot use find by Id and update because of two reasons one password validator only works on create and save
    //And the swcond reason is the two pre save middlewares will not work
    user.password =req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    //4) Log user in, send JWT
    createSendToken(user,200,res);
})