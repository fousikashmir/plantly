const users = require('../../models/userModel')
const productModel = require('../../models/productModel')
const order = require('../../models/orderModel')

async function recordWalletTransaction(userId, transactionType, amount, description) {
    try {
      const transaction = new walletTransactionCollection({
        userId,
        transactionType,
        amount,
        description,
      });
  
      await transaction.save();
      console.log('Wallet transaction recorded successfully.');
    } catch (error) {
      console.error('Error recording wallet transaction:', error);
    }
  }




const getOrders = async(req,res)=>{
    try{
        const orders = await order.find({})
        res.render('order',{message:orders})

    }catch(error){
        console.log(error.message)
    }
}

const getSingleOrder = async(req,res)=>{
    try{
        const id = req.query.id
        const orderData = await order.findById(id).populate('products.productId')
        const products = orderData.products
        res.render('singleorder',{products,orderData})

    }catch(error){
        console.log(error)
    }
}
const editOrder = async (req, res) => {
    try {
        const id = req.query.id
        const orderData = await order.findById({ _id: id })
        const totalBillAmount = orderData.totalAmount

        if (orderData.status === 'placed') {
            await order.updateOne({ _id: id }, { $set: { status: 'delivered' } })
            res.redirect('/admin/orders')
        }


        if (orderData.status === 'req-for-cancellation') {

            const walletAmountUsed = orderData.wallet
            const userid = req.session.user_id
            const userData = await users.findById({ _id: userid })

            const newWallet = parseInt(userData.wallet + walletAmountUsed)
            if (orderData.paymentMethod === 'COD') {
                await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: newWallet } })
            } else {
                await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: totalBillAmount } })
            }

            const userId = userid;
        const transactionType = 'credit';
        const transactionAmount = walletAmountUsed;
        const transactionDescription = 'Order cancelled';
        await recordWalletTransaction(userId, transactionType, transactionAmount, transactionDescription);


            await order.updateOne({ _id: id }, { $set: { status: 'cancelled' } })

            // to increase the stock
            const product = orderData.product
            for (let i = 0; i < product.length; i++) {
                const productId = product[i].productId
                const productData = await productModel.findById({ _id: productId })
                if (productData.stock === 0) {
                    await productModel.findByIdAndUpdate(productId, { $set: { status: 'In Stock' } })
                }
                const quantity = product[i].count
                await productModel.findByIdAndUpdate(productId, { $inc: { stock: +quantity } })
            }
            res.redirect('/admin/orders')
        }

        if (orderData.status === 'req-for-return') {


            const userid = req.session.user_id
            await users.findByIdAndUpdate({ _id: userid }, { $set: { wallet: totalBillAmount } })

            const userId = userid;
            const transactionType = 'credit';
            const transactionAmount =totalBillAmount;
            const transactionDescription = 'Order returned';
            await recordWalletTransaction(userId, transactionType, transactionAmount, transactionDescription);


            await order.updateOne({ _id: id }, { $set: { status: 'returned' } })

            
            const product = orderData.product
            for (let i = 0; i < product.length; i++) {
                const productId = product[i].productId
                const productData = await productModel.findById({ _id: productId })
                if (productData.stock === 0) {
                    await productModel.findByIdAndUpdate(productId, { $set: { status: 'In Stock' } })
                }
                const quantity = product[i].count
                await productModel.findByIdAndUpdate(productId, { $inc: { stock: +quantity } })

            }
            // -----
            res.redirect('/admin/orders')
        }

    } catch (error) {
        console.log(error)
    }
}
 
            



module.exports={
    getOrders,
    getSingleOrder,
    editOrder,
    recordWalletTransaction
}