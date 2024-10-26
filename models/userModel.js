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
   
    is_admin:{
        type:Number,
        required:true,
        default:0
    },
    is_block:{
        type:Number,
        required:true,
        default:0
    },
    
    
    is_verified:{
        type:Number,
        default:0,
    },
    referralCode:{
        type:String,
        unique:true
    },
    walletBalance: {
        type: Number,
        default: 0
    }

})
module.exports=mongoose.model("users",userSchema)
