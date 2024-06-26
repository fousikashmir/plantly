const users = require('../../models/userModel')
const productsModel = require('../../models/productModel')
const category = require('../../models/categoryModel')
const bcrypt = require('bcrypt')

const getAdminPanel = async(req,res)=>{
    try{
        res.render('admin-panel')
    }catch(error){
        console.log(error.message)
    }
}






module.exports = {
   
    getAdminPanel,
    }