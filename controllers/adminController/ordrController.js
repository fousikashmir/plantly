const mongoose = require('mongoose')
const productModel = require('../../models/productModel')
const order = require('../../models/orderModel')
const User = require('../../models/userModel')
const session = require('express-session')

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page-1) * limit;

        const orders = await order.find({}).skip(skip).limit(limit);
        console.log("00",orders)
        const totalOrders = await order.countDocuments();

        
        const totalPages = Math.ceil(totalOrders / limit)
        res.render('order',{
            message:orders,
            currentPage: page,
            totalPages: totalPages,
            
        })

    }catch(error){
        console.log(error.message)
    }
}




const getSingleOrder = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        console.log("H",userData)
        const id = req.query.id
        
        const session = req.session.user_id
        const orderData = await order.findById(id).populate("product.productId")
       
        const product = orderData.product
       
        res.render('singleorder', { product, orderData, session, userData })
    } catch (error) {
        console.log(error.message);
    }
}





const updateOrderStatus = async (req, res) => {
    try {
      const { orderId, status } = req.body;
      console.log(status)
      const updatedOrder = await order.findOneAndUpdate(
        { _id: orderId },
        { $set: { status: status } },
        { new: true }
      );
      console.log(updatedOrder)
  
      if (updatedOrder) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Order not found.' });
      }
    } catch (err) {
      console.log(err);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
  
 
const cancelOrder = async (req, res) => {
    try {
      const { orderId ,userId} = req.body;
  
      if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required.' });
      }
  
      const orderData = await order.findById({_id:orderId});
      if (!orderData) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
  
      
      if (orderData.status !== 'Placed') {
        return res.status(400).json({ success: false, message: 'Order cannot be cancelled.' });
      }
  
      
      await order.updateOne({ _id: orderId }, { $set: { status: 'Cancelled by Admin' } });
  
      
      const cancelledProducts = orderData.product;
      for (const product of cancelledProducts) {
        await productModel.findByIdAndUpdate(product.productId, { $inc: { stock: product.quantity } });
      }
  
    
      if (orderData.paymentMethod !== 'COD') {
        const refundAmount = orderData.totalAmount;
        const userId = orderData.user;
  
    
        await recordWalletTransaction(userId, 'credit', refundAmount, 'Order cancelled by admin');
      }
  
      res.json({ success: true, message: 'Order cancelled successfully.' });
    } catch (error) {
      console.error('Error cancelling the order:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  };
  
        const returnOrder = async (req,res) => {
                try{
                    if (orderData.status === 'req-for-return') {


                        const userid = req.session.user_id
                        
                        await User.findByIdAndUpdate({ _id: userid }, { $set: { wallet: totalBillAmount } })
            
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
                        
                        res.redirect('/admin/orders')
                    }
            

                }catch(error){
                    console.log(error.message)
                }

            }



module.exports={
    getOrders,
    getSingleOrder,
    recordWalletTransaction,
    cancelOrder,
    returnOrder,
    updateOrderStatus
}