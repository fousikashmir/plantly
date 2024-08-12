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

        for (let i = 1; i <= 12; i++) {
            let result = true;
            for (let k = 0; k < salesByYear.length; k++) {
                result = false;
                if (salesByYear[k]._id == i) {
                    sales.push(salesByYear[k])
                    break;
                } else {
                    result = true
                }
            }
            if (result) sales.push({ _id: i, total: 0 });
        }
        let salesData = [];
        for (let i = 0; i < sales.length; i++) {
            salesData.push(sales[i].total);
        }
        // console.log(salesData);

        res.render('admin-panel', { total, user_count, order_count, product_count, payment, month: salesData })
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
        let from = req.query.from ? moment.utc(req.query.from) : "ALL";
        let to = req.query.to ? moment.utc(req.query.to) : "ALL";

        if (from !== "ALL" && to !== "ALL") {
            const orderdetails = await order.aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(from),
                            $lte: new Date(to.endOf("day"))
                        },
                        status: {
                            $nin: ["cancelled", "returned"]
                        }
                    }
                }
            ]);
            req.session.Orderdtls = orderdetails
            res.render("sales-report", { message: orderdetails, from, to });
        } else {
            const orderdetails = await order.find({
                status: { $nin: ["cancelled", "returned"] }
            });
            // console.log(orderdetails);
            req.session.Orderdtls = orderdetails
            res.render('sales-report', { message: orderdetails, from, to });

        }
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
    downloadSalesReport
    }