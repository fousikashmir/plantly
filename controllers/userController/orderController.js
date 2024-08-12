const { createRequire } = require('module')
const { log } = require('console')
const session = require('express-session')

const User = require('../../models/userModel')

const order = require('../../models/orderModel');
const cart = require('../../models/cartModel');
const product = require('../../models/productModel');
const walletTransaction = require('../../models/walletTransactionModel') 

const address=require('../../models/addressModel')

const Razorpay = require('razorpay')

let dotenv = require('dotenv')
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
        const orderData = await order.findById(id).populate("product.productId")
       
        const product = orderData.product
       
        res.render('single-orderview', { product, orderData, session, userData })
    } catch (error) {
        console.log(error.message);
    }
}











const editOrder = async (req, res) => {
    try {
        const id = req.query.id
        const orderData = await order.findById({ _id: id })


        if (orderData.status === 'placed') {
            await order.updateOne({ _id: id }, { $set: { status: 'req-for-cancellation' } })
            res.redirect('/myorders')
        }

        if (orderData.status === 'delivered') {
            await order.updateOne({ _id: id }, { $set: { status: 'req-for-return' } })
            res.redirect('/myorders')
        }




    } catch (error) {
        console.log(error.message);
    }
}

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
    editOrder ,
    verifyOnlinePayment
    
}