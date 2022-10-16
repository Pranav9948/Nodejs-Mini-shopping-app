var db = require('../config/connection')
var collection = require('../config/collections');
var bcrypt = require('bcrypt');
const { reject, promise } = require('bcrypt/promises');
const collections = require('../config/collections');
const async = require('hbs/lib/async');
const { ObjectId } = require('mongodb');
const { response } = require('../app');

const Razorpay = require('razorpay');


var instance = new Razorpay({
    key_id: 'rzp_test_3IP0gghLsKDrU8',
    key_secret: 'gVpf6NZORggMO1WmPcxuW4DY'
});


module.exports = {


    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10);

            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data) => {

                resolve(data.insertedId)
            })
        })
    },


    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {

            console.log(userData)
            let loginStatus = false;
            let response = {}

            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: userData.username });

            if (user) {

                bcrypt.compare(userData.password, user.password).then((status) => {

                    if (status) {

                        console.log("login successs");
                        response.user = user;
                        response.status = true;
                        resolve(response);

                    }

                    else {

                        console.log("login failed");
                        response.status = false;
                        resolve({ status: false })
                    }
                })

            }
            else {
                console.log("login-failed")
                resolve({ status: false })
            }

        })


    },

    addtoCart: (proId, userId) => {

        let proObj = {

            item: ObjectId(proId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {

            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log("userCart:  ", userCart)


            if (userCart) {

                let ProExist = userCart.products.findIndex(product => product.item == proId);
                console.log(ProExist)


                if (ProExist != -1) {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) }, {

                        $inc: { 'products.$.quantity': 1 }

                    }).then(() => {
                        resolve()
                    })
                }
                else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {

                            $push: { products: proObj }

                        }).then((response) => {
                            resolve()
                        })
                }
            }


            else {

                let cartObj = {

                    user: ObjectId(userId),
                    products: [proObj]

                }

                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {

                    resolve()
                })

            }
        })
    },

    getcartProducts: (userId) => {

        return new Promise(async (resolve, reject) => {

            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },

                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {

                    $project:
                    {

                        item: 1, quantity: 1, productIds: { $arrayElemAt: ["$product", 0] }

                    }
                }



            ]).toArray()
            console.log("cartman:  ", cartItems)
            resolve(cartItems)

        })


    },


    getcartCount: (userId) => {

        console.log(userId)

        return new Promise(async (resolve, reject) => {

            let count = 0
            let Cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log(" consUSERid : " + userId)

            if (Cart) {

                count = Cart.products.length


            }

            resolve(count)
            console.log(" consUSERid : " + userId)
        })

    },

    changeProductQuantity: (details) => {

        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)


        return new Promise((resolve, reject) => {

            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collection.CART_COLLECTION).updateOne(
                    { _id: ObjectId(details.cart) },
                    { $pull: { products: { item: ObjectId(details.product) } } }
                ).then((response) => {

                    resolve({ removeProduct: true })
                })


            }

            else {


                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) }, {

                    $inc: { 'products.$.quantity': details.count }

                }).then((response) => {
                    resolve({ status: true })
                })
            }
        })
    },

    getTotalAmount: (userId) => {

        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([

                {
                    $match: { user: ObjectId(userId) }
                },

                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {

                    $project:
                    {

                        item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

                    }
                },
                {
                    $group: {

                        _id: null,
                        total: {
                            $sum: {
                                $multiply: [{ $toInt: "$quantity" }, { $toInt: "$product.op" }]
                            }
                        }
                    }
                }

            ]).toArray()
            console.log("Total:  ", total[0].total)
            resolve(total[0].total)

        })

    },


    getcartProductList: (userId) => {

        return new Promise(async (resolve, reject) => {
            console.log("userID: ", userId)
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            console.log("cart: ", cart)
            console.log("cart-Products: ", cart.products)

            resolve(cart.products)


        })

    },


    placeOrder: (order, product, totalPrice) => {

        return new Promise((resolve, reject) => {


            console.log("order: ", order)
            console.log("product: ", product)
            console.log("total: ", totalPrice)


            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending'

            let orderObj = {

                deliveryDetails: {
                    Mobile: order.Mobile,
                    Address: order.Address,
                    Pincode: order.Pincode
                },

                userId: ObjectId(order.userId),
                PaymentMethod: order['payment-method'],
                products: product,
                totalAmount: totalPrice,
                status: status,
                date: new Date()


            }


            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                   console.log("response1: ",response)
               
                   console.log("response: ",response.insertedId)




                resolve(response.insertedId)
            })


        })

    },

    getUserOrders: (userId) => {

        return new Promise(async (resolve, reject) => {
            console.log(userId)
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()
            console.log(orders)
            resolve(orders)
        })

    },


    getOrderProducts: (orderId) => {

        return new Promise(async (resolve, reject) => {

            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([

                {
                    $match: { _id: ObjectId(orderId) }
                },

                {
                    $unwind: '$products'
                },

                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {

                    $project:
                    {

                        item: 1, quantity: 1, product: { $arrayElemAt: ["$product", 0] }

                    }
                }

            ]).toArray()
            console.log("orderItemz: "+orderItems)
            resolve(orderItems)

        })

    },


    generateRazorpay: (orderId,totalPrice) => {

        console.log("generate razorpay",orderId,totalPrice)
        return new Promise((resolve, reject) => {

            var options = {
                amount: totalPrice*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt:""+orderId
            };
            instance.orders.create(options, function (err, order) {
                console.log( "neW OrderPlz-shOW:"    ,order);
                resolve(order)
            });


        })
    },


    verifyPayment:(details)=>{

        return new Promise((resolve,reject)=>{

            var crypto = require("crypto");
let body =  details['payment[razorpay_order_id]']+"|"+details['payment[razorpay_payment_id]']
            var expectedSignature = crypto.createHmac('sha256', 'gVpf6NZORggMO1WmPcxuW4DY')
            .update(body.toString())
            .digest('hex');

            if(expectedSignature==details['payment[razorpay_signature]']){
console.log("Payment verified")
                resolve()
            }
            else{
                reject()
            }
        })
    },


    changePaymentStatus:(orderId)=>{
       return new Promise((resolve,reject)=>{
           db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},
           {
                  $set:{
                      status:"placed"
                  }

           }).then(()=>{
               resolve()
           })
           
       })


    }




}
