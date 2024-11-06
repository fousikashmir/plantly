
const users = require('../../models/userModel')
const address = require('../../models/addressModel')
const cart = require('../../models/cartModel')
const Address = require('../../models/addressModel')
const productModel = require('../../models/productModel')
const order = require('../../models/orderModel')

const coupon = require('../../models/couponModel')
const walletTransaction = require('../../models/walletTransactionModel')
const session =require('express-session')

const Razorpay = require('razorpay')
const mongoose = require('mongoose')

let dotenv = require('dotenv')
dotenv.config()

const instance = new Razorpay({
    key_id : process.env.RAZORPAY_ID_KEY,
    key_secret : process.env.RAZORPAY_SECRET_KEY
})

async function recordWalletTransaction(userId , transactionType , amount , description,timestamp){
    try{
        const transaction = new walletTransaction({
            userId,
            transactionType,
            amount,
            description,
            timestamp
        });
        await transaction.save();
        console.log('Wallet transaction recorded succesfully')

        const user = await users.findById(userId)
        let newBalance = user.walletBalance
        if(transactionType === 'credit'){
            newBalance += amount
        }else if(transactionType === 'debit'){
            newBalance -= amount
        }
        user.walletBalance = newBalance
        await user.save()
        console.log('Wallet balance updated successfully:', user.walletBalance);




    }catch(error){
        console.log('Error recording wallet transaction',error)
    }
} 


const getCheckout = async function (req, res) {
    try {
        const session = req.session.user_id;
        const userData = await users.findById({ _id: session });
        const cartData = await cart.findOne({ userId: session }).populate("products.productId");
        const availableCoupons = await coupon.find({});
        const products = cartData.products;

        const rawTotal = await cart.aggregate([
            { $match: { userId: userData._id } },
            { $unwind: "$products" },
            { $project: { productPrice: "$products.productPrice", quantity: "$products.quantity" } },
            { $group: { _id: null, total: { $sum: { $multiply: ["$productPrice", "$quantity"] } } } }
        ]);

        const total = rawTotal.length > 0 ? rawTotal[0].total : 0;

        let snakePlantDiscount = 0;
        let floweringPlantsDiscount = 0;

        for (let i = 0; i < products.length; i++) {
            const product = products[i].productId;
            const quantityInCart = products[i].quantity;

            const currentProduct = await productModel.findById(product._id);
            const currentStock = currentProduct.stock;

            if (quantityInCart > currentStock) {
                return res.status(400).json({
                    message: `The quantity for ${product.name} exceeds the available stock. Please adjust your cart.`
                });
            }

            if (product.name === 'snake plant') {
                snakePlantDiscount += 50 * quantityInCart;
            }
            if (product.category === 'Flowering plants') {
                floweringPlantsDiscount += (product.price * 0.2) * quantityInCart;
            }
        }

        const totalAfterSnakePlantDiscount = total - snakePlantDiscount;
        const finalTotal = totalAfterSnakePlantDiscount - floweringPlantsDiscount;

        // Check for any pre-applied coupon in session
        let couponDiscount = 0;
        if (req.session.appliedCoupon) {
            couponDiscount = req.session.appliedCoupon.discountAmount || 0;
        }

        const finalTotalAmount = (finalTotal - couponDiscount).toFixed(2);
        console.log("FinalTotalAmount",finalTotalAmount)
        req.session.finalTotalAmount = finalTotalAmount;

        const addressdata = await address.findOne({ user: session });
        //const walletData = await walletTransaction.findOne({ userId: session });
        
        const walletBalance = userData.walletBalance||0 
        console.log("WB",walletBalance)
        

        res.render('checkout', {
            session,
            userData,
            originalTotal: parseFloat(total),
            Total: parseFloat(finalTotalAmount),
            addressdata: addressdata || {},
            products: cartData.products,
            snakePlantDiscount,
            floweringPlantsDiscount,
            couponDiscount,
            appliedCoupon: req.session.appliedCoupon, 
            availableCoupons,
            walletBalance:walletBalance.toFixed(2)
        });

    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while processing your request.");
    }
};


const placeOrder = async (req, res) => {
    try {
        const userData = await users.findOne({ _id: req.session.user_id });
        const Total = req.session.finalTotalAmount;
        const session = req.session.user_id;
        //console.log("Session Data at Order Placement:", req.session.appliedCoupon); // Check entire session object
    // if (!req.session.appliedCoupon) {
    //     return res.json({ success: false, message: "No coupon applied." });
    // }
    const couponId = req.session.appliedCoupon ? req.session.appliedCoupon._id : null;
    console.log("COUID",couponId)
    const couponCode = req.session.appliedCoupon ? req.session.appliedCoupon.code : null;


console.log("Coupon Code:", couponCode);          

    

        


        
        const walletBalance = userData.walletBalance || 0;
        console.log(walletBalance);

        let payment = req.body.payment;
        let paidAmount = 0;
        let walletAmountUsed = 0;
        let updatedWalletBalance = walletBalance
        let status = payment === 'online' ? 'Pending' : 'Placed'; 

        if (payment === "wallet") {
            if (walletBalance >= Total) {
                paidAmount = Total;  
                walletAmountUsed = Total;
                updatedWalletBalance = walletBalance - Total;
                status = 'Placed'; 

                userData.walletBalance = updatedWalletBalance;
                //await userData.save();
            } else { 
                return res.json({ success: false, message: "Not enough balance in the wallet." });
            }
        } else if (payment === 'online' || payment === 'COD') {
            paidAmount = req.body.amount || Total;  
            walletAmountUsed = 0;
            updatedWalletBalance = walletBalance
        }

        if (walletAmountUsed > 0) {
            const userId = req.session.user_id;
            const transactionType = 'debit';
            const transactionAmount = walletAmountUsed;
            const transactionDescription = 'Order payment';
            await recordWalletTransaction(userId, transactionType, transactionAmount, transactionDescription);
        }

        const address = req.body.address;
        const city = req.body.city;
        const state = req.body.state;
        const pin = req.body.pin;
        const cartData = await cart.findOne({ userId: req.session.user_id });
        const products = cartData.products;

        const newOrder = new order({
            deliveryDetails: address,
            details: [{ city, state, pin }],
            user: userData.name,
            userId: userData._id,
            paymentMethod: payment,
            paid: paidAmount,
            wallet: walletAmountUsed,
            discount: req.session.appliedCoupon ? req.session.appliedCoupon.discountAmount : 0,
            product: products,
            totalAmount: Total,
            date: Date.now(),
            status: status,
            couponCode: couponCode,
            coupon: couponId,

        });

        const saveOrder = await newOrder.save();
        console.log("Order data after save:", saveOrder);

        const product = saveOrder.product;
        let stockIssue = false;
        let insufficientStockProductId = null;
        
        for (let i = 0; i < product.length; i++) {
            const productId = product[i].productId;
            const quantity = product[i].quantity;
            const productData = await productModel.findById(productId);
            
            if (productData) {
                const updatedStock = productData.stock - quantity;

                if (updatedStock < 0) {
                    stockIssue = true;
                    insufficientStockProductId = productId;
                    break;  // Exit the loop if stock is insufficient
                }

                await productModel.findByIdAndUpdate(productId, { 
                    $set: { 
                        stock: updatedStock,
                        status: updatedStock <= 0 ? 'Out Of Stock' : 'In Stock'
                    }
                });
            }
        }

        if (stockIssue) {
            return res.json({ success: false, message: `Insufficient stock for product ${insufficientStockProductId}.` });
        }

        if (status === 'Placed') {
            await cart.deleteOne({ userId: userData._id });
             delete req.session.appliedCoupon
            return res.json({ success: true });
        } else {
            const orderId = saveOrder._id;
            const totalAmount = saveOrder.paid;

            const options = {
                amount: totalAmount * 100, 
                currency: "INR",
                receipt: "" + orderId
            };

            instance.orders.create(options, function (err, order) {
                return res.json({ order });
            });
        }
    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, error: error.message });
    }
};

const orderPlaced = async (req, res) => {
    try {
       
        const userData = await users.findOne({ _id: req.session.user_id })
        console.log(userData)
        const  session = req.session.user_id

        res.render('success', { session, userData })

    } catch (error) {
        console.log(error.message);

    }
}






module.exports = {
    getCheckout,
    placeOrder,
    orderPlaced,
    recordWalletTransaction,
    
}
 
 

