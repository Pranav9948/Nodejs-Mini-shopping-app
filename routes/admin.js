var express = require('express');
var router = express.Router();

const productHelpers = require('../helpers/productHelpers');
var adminHelpers=require('../helpers/adminHelpers');
const userHelpers = require('../helpers/userHelpers');


/* GET home page. */
router.get('/', function (req, res, next) {

  productHelpers.getAllProducts().then((productz) => {

    console.log(productz);
    res.render('admin-home', { admin: true, productz});

  })

});



router.get('/add-product', (req, res, next) => {

  res.render('add-product');

});


router.post('/add-product', (req, res) => {


  productHelpers.addProduct(req.body, (id) => {
    let Images = req.files.image;
    Images.mv('./public/product-images/' + id + '.jpg', (err) => {

      if (!err) {
        res.render("admin/add-product")
      }
      else {
        console.log(err);
      }
    })
  })
})
  
router.get('/deleteProduct/:id', (req, res) => {
  let proId = req.params.id
  productHelpers. deleteProduct(proId).then((response) => {
    res.redirect('/admin/')
  })
})

router.get('/editProduct/:id', async (req, res) => {

  await productHelpers.editProduct(req.params.id).then((response) => {
    console.log(response)
    res.render('editProduct',{response})
  })
})


router.post('/editProduct/:id',(req,res)=>{

  let id=req.params.id
productHelpers.updateProduct(req.body,req.params.id).then(()=>{

res.redirect('/admin');

if(req.files?.image){
  let Images = req.files.image;
  Images.mv('./public/product-images/' + id + '.jpg')


}

})

})
  
router.get('/adLogin',(req,res)=>{

  if (req.session.admin.loggedIn) {
    res.render('adLogin',{admin:true})
}
else {

    res.render('login', { "loginErr": req.session.userLoginErr });
    req.sessionloginErr = false;
}


})

router.post('/adLogin',(req,res)=>{

  console.log(req.body)


  adminHelpers.adminLogin(req.body).then((response)=>{

    if(response.status){
       
    
        req.session.loggedIn=true;
        req.session.admin=response.admin;
        res.redirect('/admin')
    
    }
    
    else{
    
        req.session.loginErr="invalid username and password"
    
        res.redirect('/admin/adlogin');
       
    }
    })
    
    
  })





router.get('/adSignup',(req,res)=>{

res.render('adSignup')


})


router.post('/adSignup',(req,res)=>{

  adminHelpers.adminSignup(req.body).then((id)=>{

    console.log(id)
  res.redirect('/admin')
  })
})


router.get('admins/ordersList', async (req, res) => {

  let orders = await userHelpers.getUserOrders(req.session.user._id)
  console.log("admin orders:", orders)
  res.render('Admin-orderList', { admin:true, orders})


})


module.exports = router;
