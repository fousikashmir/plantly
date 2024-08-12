const express = require('express')
const admin_route = express()
const config = require('../config/config')
const categoryController = require('../controllers/adminController/categoryController')
const productController = require('../controllers/adminController/productController')
const usermanageController = require('../controllers/adminController/usermanageController')
const loginController = require('../controllers/adminController/loginController')
const dashBoardController = require('../controllers/adminController/dashBoardController')
const ordrController = require('../controllers/adminController/ordrController')
const couponController = require('../controllers/adminController/couponController')

const authAdmin = require('../middlewares/authAdmin')
const session = require('express-session')

admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')



admin_route.use(session({
    secret: config.sessionSecret,
    saveUninitialized:true,
    resave:false,
    cookie:{maxAge:120000}
}))

const path = require('path')
const multer = require('multer')

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,path.join(__dirname,'../public/admin/productimages'))
    },
    filename:function(req,file,cb){
        const name = Date.now()+'-'+file.originalname
        cb(null,name)
    }
})

const upload = multer({storage:storage})
const moment = require("moment-timezone");

const parseDateMiddleware = (req, res, next) => {
    const { from, to } = req.query;

    console.log('Original from:', from);
    console.log('Original to:', to);

    if (from) {
        req.query.from = moment.utc(from);
        console.log('Transformed from:', req.query.from);
    }

    if (to) {
        req.query.to = moment.utc(to);
        console.log('Transformed to:', req.query.to);
    }

    next();
};

admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))
//Admin controller
admin_route.get('/',authAdmin.isLogin,dashBoardController.getAdminPanel)
admin_route.get('/login',authAdmin.isLogout,loginController.getLogin)
admin_route.post('/login',loginController.postLogin)
admin_route.get('/logout',authAdmin.isLogin,loginController.getLogout)

//usermanagement

admin_route.get('/users',authAdmin.isLogin,usermanageController.getUserManagement)
admin_route.get('/users/block',authAdmin.isLogin,usermanageController.blockUser)
admin_route.get('/users/unblock',authAdmin.isLogin,usermanageController.unblockUser)

//category managment

admin_route.get('/category',authAdmin.isLogin,categoryController.getCategory)
admin_route.get('/category/add',categoryController.getAddCategoryPage)
admin_route.post('/category/add',categoryController.addCategory)
admin_route.get('/category/block',categoryController.blockCategory)
admin_route.get('/category/unblock',categoryController.unBlockCategory)

//product controller

admin_route.get('/products',productController.getProducts)
admin_route.get('/products/add',productController.getAddProducts)
admin_route.post('/products/add',upload.array('image'),productController.addProducts)
admin_route.get('/products/delete',productController.deleteProduct)
admin_route.get('/products/edit',productController.editProduct)
admin_route.post('/products/edit',upload.array('image'),productController.postEditProduct)
admin_route.post('/delete_image',productController.deleteImage)
admin_route.get('/products/block',productController.blockProduct)
admin_route.get('/products/unblock',productController.unBlockProduct)

admin_route.get('/orders',ordrController.getOrders)
admin_route.get('/singleorder',ordrController.getSingleOrder)
admin_route.get('/editorder',ordrController.editOrder)


admin_route.get('/coupons',couponController.getCouponListPage)
admin_route.post('/coupons/add',couponController.postAddCoupon)
admin_route.get('/coupons/edit',couponController.editCoupon)
admin_route.post('/coupons/edit',couponController.postEditCoupon)
admin_route.get('/coupons/add',couponController.getCouponAddPage)
admin_route.get('/coupons/delete',couponController.deleteCoupon)

admin_route.get('/salesreport',authAdmin.isLogin,dashBoardController.getSalesReport)
admin_route.get('/salesreport/download', authAdmin.isLogin, parseDateMiddleware, dashBoardController.downloadSalesReport);



module.exports = admin_route

