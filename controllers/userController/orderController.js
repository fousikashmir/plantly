const { createRequire } = require('module')
const { log } = require('console')

const PDFDocument = require('pdfkit')

const User = require('../../models/userModel')

const order = require('../../models/orderModel');
const cart = require('../../models/cartModel');
const products =  require('../../models/productModel');
const walletTransaction = require('../../models/walletTransactionModel') 

const address=require('../../models/addressModel')
const Coupon = require('../../models/couponModel')

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
        const orderData = await order.find({userId:userid}).sort({date:-1})
        console.log("data",orderData)
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
        console.log("Request Body:", req.body);

        console.log("ID",orderId)
        if(!orderId || !cancelReason){
            return res.status(404).json({success:false,message:'OrderID and cancel reason are required'})
        }
        
        const orderData = await order.findById({_id:orderId})
        console.log("%%",orderData)
        

        if(orderData.status === 'Placed'){
            await order.updateOne({_id:orderId},
                {$set:{
                    status:'Canceled By User',
                    cancelReason:cancelReason
                }
            })
            if(orderData.paymentMethod !== 'COD' ){
                const user=await User.findById({ _id: req.session.user_id})
                const refundAmount= orderData.paid
                console.log("fund",refundAmount)

               

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
        const { orderId, returnReason } = req.body; 


        const orderData = await order.findById(orderId);
        if (!orderData) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }


        orderData.requests.push({
            type: 'Return',
            oderStatus: 'Pending',
            reason: returnReason,
          });
          await orderData.save()

        
        
        if (orderData.status === 'Delivered') {
            
            await order.updateOne({ _id: orderId }, { 
                $set: { 
                    status: 'req-for-return', 
                   reason : returnReason
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

            await order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: "Placed" } });
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

const downloadInvoice = async(req,res) => {
    try{
        const orderId = req.query.orderId; // Assuming orderId is passed as a query parameter
        if (!orderId) {
          return res.status(400).send('Order ID is required');
        }
    
        // Fetch the order details from the database
        const orderDoc = await order.findById(orderId).populate('userId').populate('product.productId').exec();
        if (!orderDoc) {
          return res.status(404).send('Order not found');
        }
    
        const user = await User.findById(orderDoc.userId._id).exec();
        if (!user) {
          return res.status(404).send('User not found');
        }
        let coupon = 0;
        if (orderDoc.couponApplied !== "not found") {
          const couponApplied = await Coupon.findById(orderDoc.couponApplied);
          if (couponApplied) {
            coupon = couponApplied.discountAmount; 
        } else {
            console.error('Coupon not found for ID:', orderDoc.couponApplied);
            
        }
        }
    
        // Create a new PDF document
        const doc = new PDFDocument();
        let filename = `invoice_${orderId}.pdf`;
        filename = encodeURIComponent(filename);
    
        // Set response headers
        res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-type', 'application/pdf');
    
        // Pipe the PDF into the response
        doc.pipe(res);
    
        // Add header and user details
        doc.fontSize(25).text('Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(18).text(`Order ID: ${orderDoc._id}`);
        doc.text(`Customer Name: ${user.name}`);
        doc.text(`Email: ${user.email}`);
         doc.text(`Order Date: ${orderDoc.date.toISOString()}`);
        doc.moveDown();
        doc.fontSize(16).text('Delivery Address:');
        doc.fontSize(14).text(`Delivery Address: ${orderDoc.deliveryDetails}`);
        orderDoc.details.forEach((detail) => {
          
            
            doc.text(`City: ${detail.city}`);
            doc.text(`State: ${detail.state}`);
            doc.text(`Pin: ${detail.pin}`);
          })

    
        doc.moveDown();
    
        // Add table header for items
        doc.fontSize(16).text('Ordered Items:', { underline: true });
        doc.moveDown();
    
        // Prepare table data
        const headers = ['Product', 'Quantity', 'Price', 'Total'];
        const data = orderDoc.product.map(product => [
          product.productId.name,
          product.quantity,
          product.productId.price.toFixed(2),
          (product.quantity * product.productId.price).toFixed(2)
        ]);
    
        // Function to draw the table
        const drawTable = (doc, data, headers) => {
          const startX = 50;
          let startY = doc.y;
          const rowHeight = 30;
          const colWidth = 100;
          const tableWidth = colWidth * headers.length;
          const cellPadding = 5;
    
          doc.fontSize(12);
    
          // Draw headers
          headers.forEach((header, i) => {
            doc.text(header, startX + i * colWidth + cellPadding, startY + cellPadding, { width: colWidth - cellPadding * 2, align: 'center' });
          });
    
          startY += rowHeight;
    
          // Draw rows
          data.forEach((row) => {
            row.forEach((cell, i) => {
              doc.text(cell, startX + i * colWidth + cellPadding, startY + cellPadding, { width: colWidth - cellPadding * 2, align: 'center' });
            });
            startY += rowHeight;
          });
    
          // Draw lines for table
          doc.lineWidth(1);
    
          // Draw header line
          doc.moveTo(startX, startY - rowHeight).lineTo(startX + tableWidth, startY - rowHeight).stroke();
    
          // Draw vertical lines
          for (let i = 0; i <= headers.length; i++) {
            doc.moveTo(startX + i * colWidth, startY - (rowHeight * (data.length + 1)))
              .lineTo(startX + i * colWidth, startY)
              .stroke();
          }
    
          // Draw horizontal lines
          for (let i = 0; i <= data.length + 1; i++) {
            doc.moveTo(startX, startY - (i * rowHeight)).lineTo(startX + tableWidth, startY - (i * rowHeight)).stroke();
          }
        };
    
        // Draw the table
        drawTable(doc, data, headers);
    
        doc.moveDown(2);
        doc.fontSize(13).text(`Coupon Discount: INR ${coupon.toFixed(2)}`, { align: 'right' });
        doc.fontSize(16).text(`Total Amount: INR ${orderDoc.paid}`, { align: 'right' });
    
        // Finalize the PDF and end the stream
        doc.end();
      } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while generating the invoice');
      }
    };
    
   
   

module.exports = { 

    getMyOrders,
    getSingleOrderView,
    verifyOnlinePayment,
    cancelOrder,
    returnOrder,
    downloadInvoice
    
}