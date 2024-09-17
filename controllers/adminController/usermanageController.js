
const productsModel = require('../../models/productModel')
const category = require('../../models/categoryModel')
const bcrypt = require('bcrypt')
const users = require('../../models/userModel')


const getUserManagement = async(req,res)=>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page-1) * limit
       const userDatas = await users.find({$and:[{is_verified:1},{is_admin:0}]})
       .skip(skip)
       .limit(limit);
       const totalUsers = await users.countDocuments({ $and: [{is_verified:1},{is_admin:0}]})
       const totalPages = Math.ceil(totalUsers/limit);
       res.render('users',{
        message:userDatas,
        currentPage: page,
        totalPages : totalPages
})
    }catch(error){
        console.log(error.message)
    }
}

const blockUser = async(req,res)=>{
    try{
        const id=req.query.id
        await users.updateOne({_id:id},{$set:{is_block:1}})
        res.redirect('/admin/users')

    }catch(error){
        console.log(error.message)
    }
}

const unblockUser = async(req,res)=>{
    try{
        const id=req.query.id
        await users.updateOne({_id:id},{$set:{is_block:0}})
        res.redirect('/admin/users')
    }catch(error){
        console.log(error.message)
    }
}


module.exports = { 
    getUserManagement,
    blockUser,
    unblockUser,
   }
