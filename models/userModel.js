const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt =require('bcryptjs');
const crypto = require('crypto')
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
    passwordChangedAt: Date
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

const User = mongoose.model('User',userSchema);

module.exports =User;