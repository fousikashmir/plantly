const productsModel = require('../../models/productModel')
const category = require('../../models/categoryModel')
const bcrypt = require('bcrypt')
const users = require('../../models/userModel')

const getLogin = async(req,res)=>{
    try{
        res.render('login')
    }catch(error){
        console.log(error.message)
    }
}

//post login

const postLogin = async (req, res) => {
    try {
      const emailEntered = req.body.email;
      const passwordEntered = req.body.password;
      const adminDB = await users.findOne({ email: emailEntered });
  
      if (adminDB) {
        const matchPassword = await bcrypt.compare(passwordEntered, adminDB.password);
        if (matchPassword) {
          if (adminDB.is_admin === 1) { 
            
            req.session.admin_id = adminDB._id; 
           
            res.redirect('/admin'); 
          } else {
            res.render('login', { message: 'YOU ARE NOT ADMIN' });
          }
        } else {
          res.render('login', { message: 'Entered password is wrong' });
        }
      } else {
        res.render('login', { message: 'Entered email-id is wrong' });
      }
    } catch (error) {
      console.log(error.message);
      res.render('login', { message: 'An error occurred' });
    }
  };
  


const getLogout = async(req,res)=>{
    try{
        req.session.destroy()
       return res.redirect('/admin/login')
    }catch(error){
        console.log(error.message)

    }
}

module.exports = {
    getLogin,
    postLogin,
    getLogout
}

