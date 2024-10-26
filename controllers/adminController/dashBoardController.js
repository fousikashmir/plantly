const users = require('../../models/userModel')
const productModel = require('../../models/productModel')
const category = require('../../models/categoryModel')
const order = require('../../models/orderModel')
const bcrypt = require('bcrypt')
const walletTransactionCollection = require('../../models/walletTransactionModel')
const moment = require("moment-timezone");
const excel = require('exceljs');


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






const getAdminPanel = async (req, res) => {
    try {
        const total = await order.aggregate([
            {
                $match: {
                    status: { $nin: ["cancelled", "returned"] }  
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$paid" }
                }
            }
        ]);

  // Use Promise.all  

        const [user_count, order_count, product_count] = await Promise.all([
            users.find({ is_admin: 0 }).count(),
            order.find({}).count(),
            productModel.find({}).count()
        ]);

        const payment = await order.aggregate([{ $group: { _id: "$paymentMethod", totalPayment: { $count: {} } } }]);
        console.log("Pay",payment)
        

        let sales = [];
        var date = new Date();
        var year = date.getFullYear();
        var currentyear = new Date(year, 0, 1);
        let salesByYear = await order.aggregate([
            {
                $match: {
                    createdAt: { $gte: currentyear },
                    status: { $nin: ["cancelled", "returned"] }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%m", date: "$createdAt" } },
                    total: { $sum: "$paid" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        let salesData = Array(12).fill(0);
        salesByYear.forEach(sale => {
        salesData[sale._id - 1] = sale.total;
});

const topSellingProducts = await order.aggregate([
    { $unwind: "$product" },
    {
        $group: {
            _id: "$product.productId",
            totalSold: { $sum: "$product.quantity" }
        }
    },
    { $sort: { totalSold: -1 } },
    {
        $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "productDetails"
        }
    },
    { $limit: 5 }  
]);

// Fetch top-selling categories
const topSellingCategories = await order.aggregate([
    { $unwind: "$product" },
    {
        $lookup: {
            from: "products",
            localField: "product.productId",
            foreignField: "_id",
            as: "productDetails"
        }
    },
    { $unwind: "$productDetails" }, // Unwind product details to access category information
    {
        $group: {
            _id: "$productDetails.category",  // Group by category
            totalSold: { $sum: "$product.quantity" }
        }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }  // Adjust the limit based on how many top categories you want to show
]);


       
        console.log(salesData);

        res.render('admin-panel', { total, user_count, order_count, product_count, payment, month: salesData,topSellingProducts,topSellingCategories })
    } catch (error) {
        console.log(error)
    }
}


const parseDateMiddleware = (req, res, next) => {
    const { from, to } = req.query;

    if (from) req.query.from = moment.utc(from);
    if (to) req.query.to = moment.utc(to);

    next();
};




 //sales report
 

 const getSalesReport = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;


        let from = req.query.from;
        let to = req.query.to;

        if (from && moment(from, moment.ISO_8601, true).isValid()) {
            from = moment.utc(from).startOf('day').toDate();
        } else {
            from = "ALL";
        }

        if (to && moment(to, moment.ISO_8601, true).isValid()) {
            to = moment.utc(to).endOf('day').toDate();
        } else {
            to = "ALL";
        }
 
        const matchConditions = {
            status: { $nin: ["cancelled", "returned"] }
        };

        if (from !== "ALL" && to !== "ALL") {
            matchConditions.date = {
                $gte: from,
                $lte: to
            };
        }

        const totalCount = await order.countDocuments(matchConditions);
        const totalPages = Math.ceil(totalCount / limit);

          
        const orderdetails = await order.find(matchConditions)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ date: -1 });
            // console.log(orderdetails);
            req.session.Orderdtls = orderdetails
            res.render("sales-report", {
                message: orderdetails,
                from: req.query.from,
                to:req.query.to,
                currentPage: page,
                totalPages
            });
        } catch (error) {
            console.log(error);
        }
    };



const downloadSalesReport = async (req, res) => {
    try {
        const { Orderdtls } = req.session;

        
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        
        worksheet.columns = [
            { header: 'User', key: 'user', width: 20 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Total Amount', key: 'totalAmount', width: 20 },
            { header: 'Status', key: 'status', width: 20 },
        ];

        
        worksheet.addRows(Orderdtls.map(order => ({
            user: order.user,
            date: moment(order.date).format('YYYY-MM-DD'), 
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount,
            status: order.status,
        })));

        
        const fileName = 'sales_report.xlsx';
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error in downloadSalesReport:', error);
        res.status(500).send('Internal Server Error');
    }
};








module.exports = {
   
    getAdminPanel,
    getSalesReport,
    recordWalletTransaction,
    parseDateMiddleware,
    downloadSalesReport,
    
    }