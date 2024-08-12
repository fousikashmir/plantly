const users = require('../../models/userModel')
const walletTransaction = require('../../models/walletTransactionModel')


const loadWallet = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const wallets = await walletTransaction.find({userId : userId})
        const userData = await users.findOne({_id:req.session.user_id})

        res.render('wallet', {user:req.session.user,wallets,session:userId,userData})

    }catch(error){
        console.log('Error fetching wallet transactions:',error)
        res.status(500).send('Internal Server Error');
    }

}



     


module.exports = {
    loadWallet,
    
}