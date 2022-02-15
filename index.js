var cors = require('cors')
require('dotenv').config()

var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer');
var md5 = require('md5');
var app = express();
var multer = multer();

app.use(cors());
app.use(bodyParser.json());
app.use(multer.array()); //for parsing multiple/form-data

const PORT = process.env.PORT;

app.listen(PORT, function () {
    console.log("Server Started");
})

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

var URL = "mongodb+srv://anupam:HdqblhYsM4y0ePwo@cluster0.vnrs1.mongodb.net?retryWrites=true&w=majority";

var config = { useUnifiedTopology: true };

MongoClient.connect(URL, config, function (err, myMongoClient) {
    if (err) {
        console.log("connection failed");
    }
    else {
        console.log("connection success");
        /// ORDER API ///
        app.post("/order/placeOrder", function (req, res) {
            const _data = req.body;
            try {
                myMongoClient.db("FlashShop").collection("order").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
        })

        app.get("/order/allOrder", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("order");
            collection.find().toArray(function (err, data) { //find() er vitor obj akare condition o apply kora jay. jemon, {ID : "191-35-2640"}
                if (err) {
                    console.log("Error selecting data");
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: data });
                }
            })
        })

        app.get("/order/myOrder", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("order");
            collection.find({ playerID: req.body.playerID }).toArray(function (err, data) { //find() er vitor obj akare condition o apply kora jay. jemon, {ID : "191-35-2640"}
                if (err || data.length == 0) {
                    console.log("Error selecting data");
                    res.send({ status: "failed", playerID: req.body.playerID });
                }
                else {
                    res.send({ status: "done", playerID: req.body.playerID, result: data });
                }
            })
        })

        app.post("/order/status", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("order");
            let id = new ObjectId(req.body._id); //make id as object
            let newStatus = req.body.newStatus;
            collection.updateOne(
                { _id: id }, //targeted data
                { $set: { orderStatus: newStatus } }, //change data in that selected json
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.post("/order/delete", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("order");
            let id = new ObjectId(req.body._id); //make id as object
            collection.deleteOne(
                { _id: id }, //targeted data
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        /// PACKAGE API ///

        app.post("/package/create", function (req, res) {
            const _data = req.body;
            try {
                myMongoClient.db("FlashShop").collection("package").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
        })

        app.get("/package/allPackages", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("package");
            collection.find().toArray(function (err, packages) {
                if (err) {
                    res.send({ status: "failed" });
                }
                else {
                    var collection = myMongoClient.db("FlashShop").collection("settings");
                    collection.find().toArray(function (err, data) {
                        if (err) {
                            res.send({ status: "failed" });
                        }
                        else {
                            //calculation of price
                            let playerID_USD = parseInt(data[0].playerID_USD_Unit_per_hundredDiamond);
                            let gaemLogin_USD = parseInt(data[0].gameLogin_USD_Unit_per_hundredDiamond);

                            let res_arr = [];
                            for (let i = 0; i < packages.length; i++) {
                                let price = 0, discount_price = 0;
                                let diamond = parseInt(packages[i].diamond);
                                let discount = parseInt(packages[i].discount);
                                let id = packages[i]._id;
                                let _topUp_type = packages[i].topUp_type
                                if (_topUp_type == "id code") {
                                    price = (diamond / 100) * playerID_USD;
                                }
                                else if (_topUp_type == "id password") {
                                    price = (diamond / 100) * gaemLogin_USD;
                                }
                                price = Math.floor(price);
                                discount_price = Math.ceil(price - (price * (discount / 100)));
                                let tmp = {
                                    _id: id,
                                    diamond: diamond,
                                    topUp_type: _topUp_type,
                                    regularPrice: price,
                                    discountPrice: discount_price,
                                    discountAmount: discount
                                }
                                res_arr.push(tmp);
                            }
                            //console.log(res_arr)
                            res_arr.sort(function (a, b) {
                                return (a.discountPrice < b.discountPrice ? -1 : 1);
                            });
                            res.send({ status: "done", result: res_arr });
                        }
                    })
                    //res.send({ status: "done", result: data });
                }
            })
        })

        app.post("/package/edit", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("package");
            let id = new ObjectId(req.body._id); //make id as object
            let _diamond = req.body.diamond;
            let _topUp_type = req.body.topUp_type;
            let _discount = req.body.discount;
            collection.updateOne(
                { _id: id }, //targeted data
                {
                    $set: {
                        diamond: _diamond,
                        topUp_type: _topUp_type,
                        discount: _discount
                    }
                },
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.post("/package/delete", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("package");
            let id = new ObjectId(req.body._id); //make id as object
            collection.deleteOne(
                { _id: id }, //targeted data
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.get("/package/singlePackage", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("package");
            let id = new ObjectId(req.body._id); //make id as object
            collection.find({ _id: id }).toArray(function (err, data) {
                if (err || data.length == 0) {
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: data });
                }
            })
        })

        /// SETTINGS API ///

        app.post("/settings/edit", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("settings");
            let id = new ObjectId(req.body._id); //make id as object

            let _popUp_notification = req.body.popUp_notification;
            let _fixed_notification = req.body.fixed_notification;
            let _rulesAndConditions = req.body.rulesAndConditions;
            let _playerID_USD_Unit_per_hundredDiamond = req.body.playerID_USD_Unit_per_hundredDiamond;
            let _gameLogin_USD_Unit_per_hundredDiamond = req.body.gameLogin_USD_Unit_per_hundredDiamond;
            let _takeNewOrder = req.body.takeNewOrder;

            collection.updateOne(
                { _id: id }, //targeted data
                {
                    $set: {
                        popUp_notification: _popUp_notification,
                        fixed_notification: _fixed_notification,
                        rulesAndConditions: _rulesAndConditions,
                        playerID_USD_Unit_per_hundredDiamond: _playerID_USD_Unit_per_hundredDiamond,
                        gameLogin_USD_Unit_per_hundredDiamond: _gameLogin_USD_Unit_per_hundredDiamond,
                        takeNewOrder: _takeNewOrder
                    }
                },
                function (err, data) {
                    if (err) {
                        res.send({ status: "failed" })
                    }
                    else {
                        res.send({ status: "done" })
                    }
                }
            )
        })

        app.get("/settings/all", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("settings");
            collection.find().toArray(function (err, data) {
                if (err) {
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: data });
                }
            })
        })

        /// Dashboard ///

        app.get("/dashboard/totalOrder", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("dashboard");
            collection.find().toArray(function (err, data) {
                if (err) {
                    res.send({ status: "failed" });
                }
                else {
                    let total = data[0].totalOrder;
                    res.send({ status: "done", totalOrder: total });
                }
            })
        })

        app.post("/dashboard/increaseOrder", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("dashboard");
            let id = new ObjectId("620aa6cd9657e910744c93a1");
            var tmp = myMongoClient.db("FlashShop").collection("dashboard").find().toArray((err, data) => {
                if (err) { res.send({ status: "failed" }) }
                else {
                    let previous_data = data[0].totalOrder
                    collection.updateOne(
                        { _id: id }, //targeted data
                        {
                            $set: { totalOrder: (parseInt(previous_data) + 1) }
                        },
                        function (err, data) {
                            if (err) {
                                res.send({ status: "failed" })
                            }
                            else {
                                res.send({ status: "done" })
                            }
                        }
                    )
                }
            });
        })

        app.post("/dashboard/increaseSell", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("dashboard");
            let id = new ObjectId("620aa6cd9657e910744c93a1"); //make dashboard id as object
            let increaseAmount = req.body.increaseAmount;
            var tmp = myMongoClient.db("FlashShop").collection("dashboard").find().toArray((err, data) => {
                if (err) { res.send({ status: "failed" }) }
                else {
                    let previous_data = data[0].totalSell
                    collection.updateOne(
                        { _id: id }, //targeted data
                        {
                            $set: { totalSell: (parseInt(previous_data) + parseInt(increaseAmount)) }
                        },
                        function (err, data) {
                            if (err) {
                                res.send({ status: "failed" })
                            }
                            else {
                                res.send({ status: "done" })
                            }
                        }
                    )
                }
            });
        })

        app.get("/dashboard/all", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("dashboard");
            collection.find().toArray(function (err, data) {
                if (err) { res.send({ status: "failed" }); }
                else {
                    var order = myMongoClient.db("FlashShop").collection("order");
                    order.find().toArray(function (err, allOrder) {
                        if (err) { res.send({ status: "failed" }); }
                        else {
                            let sell_pending = 0, successful_order = 0;
                            for (let i = 0; i < allOrder.length; i++) {
                                if (allOrder[i].orderStatus == "PENDING") {
                                    sell_pending += parseInt(allOrder[i].price);
                                }
                                if (allOrder[i].orderStatus == "RECEIVED") {
                                    successful_order++;
                                }
                            }
                            const json_data = {
                                totalOrder: data[0].totalOrder,
                                totalSell: data[0].totalSell,
                                sellPending: sell_pending,
                                successfulOrderCount: successful_order
                            }
                            res.send({ status: "done", result: json_data });
                        }
                    })
                }
            })
        })

        /// ADMIN LOGIN ///

        app.post("/admin/loginInfo", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("admin");
            let username = req.body.username;
            let password = req.body.password;
            collection.find().toArray(function (err, data) {
                if (err) {
                    res.send({ status: "failed" });
                }
                else {
                    let _name = "";
                    for (let i = 0; i < data.length; i++) {
                        if (username == data[i].username && password == md5(data[i].password)) {
                            _name = data[i].name;
                            break;
                        }
                    }
                    if (_name != "") {
                        res.send({ status: "done", name: _name });
                    }
                    else {
                        res.send({ status: "failed" });
                    }
                }
            })
        })
    }
})

app.get("/", function (req, res) {
    res.send("<div style='padding: 25px 5px 20px 5px; font-family:arial'><meta name='viewport' content='width=device-width, initial-scale=1.0'><center><img src='https://www.pngkit.com/png/full/816-8161545_freefire-sticker-garena-free-fire-logo-png.png' width='200'/><h1>FlashShop - server running</h1></center></div>");
})
