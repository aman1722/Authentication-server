const mongoose = require("mongoose")


// user Schema
const userschema = mongoose.Schema({
    name:{type:String},
    email:{type:String},
    password:{type:String},
    accessToken:{type:String},
    oauth:{type:Object}
},{
    versionKey:false
})


// user Model
const usermodel = mongoose.model("user",userschema)

module.exports={usermodel}
