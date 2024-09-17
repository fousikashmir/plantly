const { createRequire } = require('module')
const { log } = require('console')
const session = require('express-session')

const User = require('../../models/userModel')

const order = require('../../models/orderModel');
const cart = require('../../models/cartModel');
const products =  require('../../models/productModel');
const walletTransaction = require('../../models/walletTransactionModel') 

const address=require('../../models/addressModel')

const Razorpay = require('razorpay')

let dotenv = require('dotenv');
const { recordWalletTransaction } = require('./checkoutController');
dotenv.config()

const razorpayInstance = new Razorpay({
    key_id : process.env.RAZORPAY_ID_KEY,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})

const { ObjectId } = require('mongoose').Types;




const getMyOrders = async(req,res)=>{
    try{
        const userData = await User.findOne({_id:req.session.user_id})
        const userid = req.session.user_id
        const orderData = await order.find({userId:userid})
        res.render('my-orders',{message:orderData,session:userid,userData})

    }catch(error){
        console.log(error.message)
    }
}

const getSingleOrderView = async (req, res) => {
    try {
        const userData = await User.findOne({ _id: req.session.user_id })
        const id = req.query.id
        const session = req.session.user_id
        const orderData = await order.findById({_id:id}).populate("product.productId")
       
        const product = orderData.product
       
        res.render('single-orderview', { product, orderData, session, userData })
    } catch (error) {
        console.log(error.message);
    }
}













const cancelOrder = async(req,res) =>{
    try{
        const {orderId,cancelReason} = req.body
        console.log("ID",orderId)
        if(!orderId || !cancelReason){
            return res.status(404).json({success:false,message:'OrderID and cancel reason are required'})
        }
        
        const orderData = await order.findById({_id:orderId})
        console.log("%%",orderData)
        

        if(orderData.status === 'Placed'){
            await order.updateOne({_id:orderId},
                {$set:{
                    status:'canceled by user',
                    cancellationReason:cancelReason
                }
            })
            if(orderData.paymentMethod !== 'COD' ){
                const user=await User.findById({ _id: req.session.user_id})
                const refundAmount= orderData.totalAmount

               

                await recordWalletTransaction(
                    orderData.userId,
                    'credit',
                    refundAmount,
                    'order cancelled'
                )


            }
            const canceledProducts = orderData.product;
      for (const product of canceledProducts) {
        await products.findByIdAndUpdate(product.productId, { $inc: { stock: product.quantity } });
      }

      res.json({ success: true, message: 'Order cancelled successfully and wallet credited.',
        newStatus:'cancelled'
      });
    } else {
      res.status(400).json({ success: false, message: 'Order cannot be cancelled.' });
        }
      }catch(error){
        console.log(error.message)
    }
   }

   const returnOrder = async (req, res) => {
    try {
        const { orderId, reason } = req.body; 


        const orderData = await order.findById(orderId);

        if (!orderData) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        
        if (orderData.status === 'Delivered') {
            
            await order.updateOne({ _id: orderId }, { 
                $set: { 
                    status: 'req-for-return', 
                    returnReason: reason 
                } 
            });

            
            res.json({ success: true, message: 'Return request submitted successfully.' });
        } else {
            res.status(400).json({ success: false, message: 'Order cannot be returned.' });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


const verifyOnlinePayment = async (req, res) => {
    try {


        const details = (req.body)
        console.log("**",details)

        const crypto = require('crypto');
        let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET_KEY);
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)

        hmac = hmac.digest('hex');


        // console.log(details.payment.razorpay_signature);

        if (hmac == details.payment.razorpay_signature) {

            await order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: "placed" } });
            await order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { paymentId: details.payment.razorpay_payment_id } });
            await cart.deleteOne({ userId: req.session.user_id });
            res.json({ success: true });
        } else {
            await order.findByIdAndRemove({ _id: details.order.receipt });
            res.json({ success: false });
        }


    } catch (error) {
        console.log(error.message);

    }
}


module.exports = { 

    getMyOrders,
    getSingleOrderView,
    verifyOnlinePayment,
    cancelOrder,
    returnOrder
    
}