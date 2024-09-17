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
        defualt:false
    },
    is_block:{
        type:Number,
        required:true,
        defualt:false
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
