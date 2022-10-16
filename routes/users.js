var express = require('express');
const res = require('express/lib/response');
const async = require('hbs/lib/async');
const { response } = require('../app');
const productHelpers = require('../helpers/productHelpers');
const userHelpers = require('../helpers/userHelpers');
var router = express.Router();


const verifyLogin = (req, res, next) => {

    if (req.session.userLoggedIn) {
        next();
    }
    else {
        res.redirect('/users/login')
    }

}




/* GET users listing. */
router.get('/', async function (req, res, next) {

    let user = req.session.user
    let cartCount = null;

    if (req.session.user) {

        cartCount = await userHelpers.getcartCount(req.session.user._id)
    }

    productHelpers.getAllProducts().then((productz) => {

        res.render('user-home', { admin: false, productz, user, cartCount });
    })
});


router.get('/login', (req, res) => {


    if (req.session.userLoggedIn) {
        res.redirect('/users')
    }
    else {

        res.render('login', { "loginErr": req.session.userLoginErr });
        req.sessionLoginErr = false;
    }

})


router.post('/login', (req, res) => {


    userHelpers.doLogin(req.body).then((response) => {

        if (response.status) {

            req.session.user = response.user;
            req.session.userLoggedIn = true;
           
            res.redirect('/users')

        }

        else {

            req.session.userLoginErr = "invalid username and password"

            res.redirect('/users/login');

        }
    })

})




router.get('/signup', (req, res) => {
    res.render('sign-up')
})


router.post('/signup', (req, res) => {

    userHelpers.doSignup(req.body).then((response) => {

        req.session.user = response
        req.session.userLoggedIn = true
      
        console.log(response)
        res.redirect('/users')
    })
})




router.get('/logout', (req, res) => {


    req.session.user=null
    res.redirect('/users/login')

})


router.get('/cart', verifyLogin, async (req, res) => {

    let CartProducts = await userHelpers.getcartProducts(req.session.user._id)
  

    let totalValue = 0

    if (CartProducts.length > 0) {

        TotalAmount = await userHelpers.getTotalAmount(req.session.user._id)
    }



    res.render('cart', { CartProducts, user: req.session.user, TotalAmount })

})

router.get('/add-to-cart/:id', (req, res) => {

    console.log("api call")
    let ProId = req.params.id;
    let userId = req.session.user._id

    userHelpers.addtoCart(ProId, userId).then(() => {

        res.json({ status: true })

    })

})

router.post('/change-product-quantity/', (req, res) => {
    console.log("req.body  ", req.body)
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
        response.total = await userHelpers.getTotalAmount(req.body.user)

        res.json(response)
    })

})


router.get('/orders', verifyLogin, async (req, res) => {

    let total = await userHelpers.getTotalAmount(req.session.user._id)

    console.log(total)
    res.render('orders', { user: req.session.user, total })
})


router.post('/orders', verifyLogin, (async (req, res) => {

    console.log(" req.body:  ", req.body)

    let product = await userHelpers.getcartProductList(req.body.userId)
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)

    userHelpers.placeOrder(req.body, product, totalPrice).then((orderId) => {
        if (req.body['payment-method'] == 'COD') {
            res.json({ codSuccess: true })
        }
        else {
            userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
                res.json(response)
            })
        }
        console.log(response)

    })

}))


router.get('/order-success', (req, res) => {

    res.render('order-success', { user: req.session.user })

})


router.get('/ordersList', async (req, res) => {

    console.log("??:", req.session.user._id)
    let orders = await userHelpers.getUserOrders(req.session.user._id)
    console.log("orders:", orders)
    res.render('orderList', { user: req.session.user, orders})


})


router.get('/view-order-products/:id', async (req, res) => {

    let OrderProductItem = await userHelpers.getOrderProducts(req.params.id)
    console.log("orderItems: ", OrderProductItem)
    res.render('view-order-products', { user: req.session.user, OrderProductItem })
})


router.post('/verify-payment', (req, res) => {

    console.log(req.body);

    userHelpers.verifyPayment(req.body).then(() => {
        userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
            console.log("payment successfull")
            res.json({ status: true })
        })

    }).catch((err) => {
        console.log(err)
        res.json({ status: false, errMsg: "" })
    })

})


module.exports = router;
