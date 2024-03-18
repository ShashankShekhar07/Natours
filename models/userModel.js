const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt =require('bcryptjs');
const crypto = require('crypto');
const catchAsync = require('./../utils/catchAsync');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please Tell us your name!']
    },
    email: {
        type: String,
        required: [true,'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,   
        select: false     
    },
    passwordConfirm: {
        type: String,
        required: [true,"Please confirm your password"],
        validate: {
            //This only works on Save and Create!!!
            validator: function(el) {
                return el === this.password; //abc===abc
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

userSchema.pre('save',async function(next){
    //when password is modified then only this function should work
    if(!this.isModified('password')) return next(); 
    //hash the password with cost of 12
    this.password = await bcrypt.hash(this.password,12);
    //The second argument is 12. This is a number called the "cost factor" which controls how computationally expensive it is to generate the hash. A higher number makes it slower to generate the hash but also more secure.
    //Delete passwordConfirm Field
    this.passwordConfirm= undefined;
    next();
})

userSchema.pre('save',function(next){
    if(!this.isModified('password') || this.isNew){
        return next();
    }

    this.passwordChangedAt = Date.now()-1000;
    next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    //tho this.pass is correct but pass is not defined so we use select('+password') in the login controller
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
  
      return JWTTimestamp < changedTimestamp; //If JWTtokem at 100 and we changed 
      //password at 200 so 100<200 return true
    }
  
    // False means NOT changed
    return false;
  };

// userSchema.methods.createPasswordResetToken = function(){
//     const resetToken = crypto.randomBytes(32).toString('hex');

//     this.passwordResetToken= crypto
//     .createHash('sha256')
//     .update(resetToken)
//     .digest('hex');

//     console.log({resetToken}, this.passwordResetToken)

//     this.passwordResetExpires = Date.now() + 10 *60 *1000;//10 min

//     return resetToken;
// }

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex'); //random string
  
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); //no need to be strong so no need to use bcrypt
  
    console.log({ resetToken }, this.passwordResetToken);
  //                normal token      encrypted token
  //note- only encrypted token is stored in database and normal token is sent to user 
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  
    return resetToken;
  };

const User = mongoose.model('User',userSchema);

module.exports =User;