const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true   
    },
   discount: {
        type: String,
        required: false,
        trim: true
    },
    price: {
        type: Number,
        required: true,
       min:0 
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: Array,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min:0   
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    status:{
        type:String,
        required:true,
        trim: true
    },
    popularity: {
        type: Number,
        default: 0
    },
    average_rating: {
        type: Number,
        default: 0
    },
    is_featured: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('products', productSchema)

