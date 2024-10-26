const mongoose = require('mongoose')
const session = require('express-session');
const productModel = require('../../models/productModel')
const order = require('../../models/orderModel')
const User = require('../../models/userModel')
const walletTransaction = require('../../models/walletTransactionModel') 



async function recordWalletTransaction(userId, transactionType, amount, description) {
    try {
      const transaction = new walletTransaction({
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

        const month = req.query.month || '';
        const productId = req.query.product || '';
        
        let filter = {}
        if(month){
          const startDate = new Date(2024,month-1,1)
          const endDate = new Date(2024,month,0)
          filter['date'] = { $gte: startDate, $lt: endDate }
        }

        if(productId){
          filter['product.productId'] = productId
        }

        const orders = await order.find(filter).sort({createdAt:-1}).skip(skip).limit(limit);
        
        const totalOrders = await order.countDocuments(filter);

        
        const totalPages = Math.ceil(totalOrders / limit)
        const products = await productModel.find({})
        res.render('order',{
            message:orders,
            currentPage: page,
            totalPages: totalPages,
            products:products
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
      console.log("ORder",orderId)
      console.log("Us",userId)
  
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
  
      
      await order.updateOne({ _id: orderId }, { $set: { status: 'Canceled By Admin' } });
  
      
      const cancelledProducts = orderData.product;
      for (const product of cancelledProducts) {
        await productModel.findByIdAndUpdate(product.productId, { $inc: { stock: product.quantity } });
      }
  
    
      if (orderData.paymentMethod !== 'COD') {
        const refundAmount = orderData.totalAmount;
      
        console.log(`Processing refund of ${refundAmount} for user ${userId}`);

        const userData = await User.findById(userId);
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

  
        userData.walletBalance += refundAmount;

        
        await userData.save();
    
  
    
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
                    const {orderId,userId} =req.body
                    console.log("$$",orderId)
                    
                     
                     console.log("UU",userId)

                     const orderData = await order.findById(orderId);
                    console.log("Order Data Retrieved:", orderData); 
                   if (!orderData || orderData.status !== 'req-for-return') {
                    console.log("Condition Triggered: Order not found or incorrect status.");
                       return res.status(404).json({ success: false, message: 'Order not found or return not requested' });
                             }

                           
                    

                    const returnRequest = orderData.requests.find(request => request.type === 'Return' && request.oderStatus === 'Pending');
                    if (returnRequest) {
                      returnRequest.status = 'Accepted';
                      orderData.status = "Return Completed";
                    }
                    await orderData.save();

                    const returnedProducts = orderData.product;
                    for(const product of returnedProducts){
                      await productModel.findByIdAndUpdate(product.productId, { $inc: { stock: product.quantity } });
                    }

                       const totalBillAmount = orderData.totalAmount;
                       const userData = await User.findById(userId);
                       if (!userData) {
                       return res.status(404).json({ success: false, message: 'User not found' });
                        }

    
                        userData.walletBalance += totalBillAmount;

      
                       await userData.save();
                       const transactionType = 'credit';
                        const transactionAmount =totalBillAmount;
                        

                        const transactionDescription = 'Order returned';
                        await recordWalletTransaction(userId, transactionType, transactionAmount, transactionDescription);
            
            
                        await order.findByIdAndUpdate({ _id: id }, { $set: { status: 'returned' } })
            
                        
                       res.json({success:true})
                        
                      
                    
            

                }catch(error){
                    console.log(error.message)
                }

            }

            const rejectReturn = async (req, res) => {
              try {
                const { orderId } = req.body;
                const orderData = await order.findById(orderId);
            
                const returnRequest = orderData.requests.find(request => request.type === 'Return' && request.oderStatus === 'Pending');
                if (returnRequest) {
                  returnRequest.status = 'Rejected';
                  orderData.status = "Return Rejected";
                }
                await orderData.save();
                res.json({ success: true });
            
              } catch (err) {
                console.log(err);
              }
            }



module.exports={
    getOrders,
    getSingleOrder,
    recordWalletTransaction,
    cancelOrder,
    returnOrder,
    updateOrderStatus,
    rejectReturn
}