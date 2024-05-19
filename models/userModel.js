const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    wallet:{
        type:Number,
        default:0
    },
    is_Admin:{
        type:Number,
        required:true
    },
    is_Block:{
        type:Number,
        required:true
    },
    is_verified:{
        type:Number,
        defualt:0,
    },
    referralCode:{
        type:String,
        unique:true
    }

})
module.exports=mongoose.model("users",userSchema)
