const mongoose = require('mongoose')
const {ObjectId} = require('mongodb')

const cartSchema = mongoose.Schema({
    userId : {
        type : ObjectId,
        ref : 'users',
        req : true
    },
    products : [{
        productId : {
            type : ObjectId,
            ref : 'products',
            req : true,
        },
        quantity : {
            type : Number,
            default : 1
        },
        productPrice : {
            type : Number,
            req : true
        },
        totalPrice : {
            type : Number,
            default : 0
        }
    }]

        
    
})
module.exports = mongoose.model('carts',cartSchema)