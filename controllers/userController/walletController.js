const users = require('../../models/userModel')
const walletTransaction = require('../../models/walletTransactionModel')




const loadWallet = async(req,res)=>{
    try{
        const userId = req.session.user_id;
        const wallets = await walletTransaction.find({userId : userId})
        const userData = await users.findOne({_id:req.session.user_id})
        // let walletBalance = 0;
        
        // wallets.forEach(transaction => {
        //     console.log('Transaction Object:', transaction);
            
        //     const amount = Number(transaction.amount || 0); // Default to 0 if amount is missing
        //     if (transaction.transactionType === 'credit') {
        //         walletBalance += amount;
        //     } else if (transaction.transactionType === 'debit') {
        //         walletBalance -= amount;
        //     }
            
        //     console.log(`Type: ${transaction.transactionType}, Amount: ${amount}, Current Balance: ${walletBalance}`);
        // });
        
        //    req.session.walletBalance = walletBalance;


        const walletBalance = userData.walletBalance||0 
        console.log("WB",walletBalance)
        
        

        res.render('wallet', {user:req.session.user,wallets,session:userId,userData,walletBalance})

    }catch(error){
        console.log('Error fetching wallet transactions:',error)
        res.status(500).send('Internal Server Error');
    }

}



     


module.exports = {
    loadWallet,
    
}