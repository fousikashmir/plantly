
const mongoose = require("mongoose");

const productsModel = require('../../models/productModel')
const category = require('../../models/categoryModel')
const bcrypt = require('bcrypt')

const getCategory = async(req,res)=>{
    try{
        const page = parseInt(req.query.page) || 1
        const limit = parseInt(req.query.limit) || 10
        const skip = (page-1) * limit
        const categoryDatas = await category.find().skip(skip).limit(limit)
        const totalCategories = await category.countDocuments()
        res.render('category',{
            message:categoryDatas,
        currentPage : page,
    totalPages : Math.ceil(totalCategories / limit)})

    }catch(error){
        console.log(error.message)
    }
}

const getAddCategoryPage = async(req,res)=>{
    try{
        res.render('add-category')

    }catch(error){
        console.log(error.message)
    }

}

const addCategory = async(req,res)=>{
    try{
        const newCategory = req.body.category.trim();
        if(newCategory.length==0){
            res.render('add-category',{message : 'Enter category name'})
        }
        const categoryExists = await category.findOne({name: new RegExp('^'+ newCategory + '$','i')})
        if (categoryExists){
            res.render('add-category',{message:'category already exists'})
        }else{
            const categoryData = new category({
                name:req.body.category,
                is_block:0

            }) 
            await categoryData.save()
            res.redirect('/admin/category')
        }

    }catch(error){
        console.log(error.message)
    }
}

const blockCategory = async(req,res)=>{
    try{
    const id = req.query.id
    await category.updateOne({_id :id},{ $set:{is_block:1}})
    res.redirect('/admin/category')
    }catch(error){
        console.log(error.message)
    }

}

const unBlockCategory = async(req,res)=>{
    try{
        const id = req.query.id
        await category.updateOne({_id:id},{$set:{is_block:0}})
        res.redirect('/admin/category')

    }catch(error){
        console.log(error.message)
    }
}

module.exports={
    getCategory,
    getAddCategoryPage,
    addCategory,
    blockCategory,
    unBlockCategory

}

