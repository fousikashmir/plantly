const mongoose = require('mongoose')
const couponSchema = new mongoose.Schema({
    code:{
        type:String,
        required:true
    },
    discountType:{
        type:String,
        required:true
    },
    discountAmount:{
        type:Number,
        min:0
    },
    maxDiscountAmount:{
        type:Number,
        min:0
    },
    user:{
        type:Array,
        ref:"users",
        default:[]

    },
    maxUsers:{
        type:Number
    },
    status:{
        type: String,
        enum: ['Active', 'Expired', 'Disabled'], 
        default: 'Active'
    },
    expiryDate:{
        type:Date,
        required:true
    }

})

const couponModel = mongoose.model("coupon",couponSchema);
module.exports = couponModel;