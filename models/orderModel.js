const mongoose = require('mongoose')
const orderSchema = new mongoose.Schema({
    deliveryDetails:{
        type:String,
        required:true
    },
    details:[{
        city:{
            type:String,
            required:true
        },
        state:{
            type:String,
            required:true
        },
        pin:{
            type:String,
            required:true
        },


}],
user:{type:String},
userId:{type:mongoose.Types.ObjectId,
    ref:"users"
},
paymentMethod:{type:String},
product:[{
    productId:{
        type:mongoose.Types.ObjectId,
        ref:"products",
        required:true

    },
    quantity:{
        type:Number,
        required:true
    
    },
    status:{
        type:String,
        default:"Placed"
    
    },
    
    cancelReason:{
        type:String,
        default:null
    }

}],

paid:{type:Number},
totalAmount:{type:Number},
status:{
    type:String,
    default:"Placed"

},
date:{type: Date},

cancelReason:{
    type:String,
    default:null
},
returnReason:{
    type:String,
    default:null
},
paymentId:{type:String},
requests:[{
    type:{
        type:String,
        enum:['Cancel','Return'],
    },
    oderStatus:{
        type:String,
        enum:['Pending', 'Accepted', 'Rejected'],
        
    },
    
    reason:String,
},],

},



{timestamps:true}

)
module.exports = mongoose.model("order",orderSchema)