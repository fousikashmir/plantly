const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types;
const wishListSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    product:[{
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'products',
            required:true
        },
        name:{
            type:String
        },
        price:{
            type:Number
        }
    }]
})
module.exports=mongoose.model('wishList',wishListSchema)