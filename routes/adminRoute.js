const express = require('express')
const admin_route = express()
const config = require('../config/config')
const categoryController = require('../controllers/adminController/categoryController')
const productController = require('../controllers/adminController/productController')
const usermanageController = require('../controllers/adminController/usermanageController')
const loginController = require('../controllers/adminController/loginController')
const dashBoardController = require('../controllers/adminController/dashBoardController')

//const auth = require('../middleware/adminAuth')
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

admin_route.use(express.json())
admin_route.use(express.urlencoded({extended:true}))
//Admin controller
admin_route.get('/',dashBoardController.getAdminPanel)
admin_route.get('/login',loginController.getLogin)
admin_route.post('/login',loginController.postLogin)
admin_route.get('/logout',loginController.getLogout)

//usermanagement

admin_route.get('/users',usermanageController.getUserManagement)
admin_route.get('/users/block',usermanageController.blockUser)
admin_route.get('/users/unblock',usermanageController.unblockUser)

//category managment

admin_route.get('/category',categoryController.getCategory)
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

module.exports = admin_route

