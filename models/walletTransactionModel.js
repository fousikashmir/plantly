const mongoose = require('mongoose')

const walletTransactionSchema = new mongoose.Schema({
    userId : {
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    transactionType : {
        type : String,
        enum : ['debit','credit'],
        required:true,
    },
    amount:{
        type : Number,
        required : true,
    },
    description:{
        type : String,
    },
    timeStamp : {
        type : Date,
        required : true,
        default : Date.now,
    }

})

const walletTransaction = mongoose.model('WalletTransaction',walletTransactionSchema)

module.exports = walletTransaction;