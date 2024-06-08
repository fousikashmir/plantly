const express = require('express')
const admin_route = express()
const config = require('../config/config')
const adminController = require('../controllers/adminController')
const productController = require('../controllers/productController')


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
admin_route.get('/',adminController.getAdminPanel)
admin_route.get('/login',adminController.getLogin)
admin_route.post('/login',adminController.postLogin)
admin_route.get('/logout',adminController.getLogout)

//product controller

admin_route.get('/products',productController.getProducts)
admin_route.get('/products/add',productController.getAddProducts)
admin_route.post('/products/add',upload.array('image'),productController.addProducts)

module.exports = admin_route

