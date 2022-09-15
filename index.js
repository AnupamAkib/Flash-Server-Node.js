var cors = require('cors')
require('dotenv').config()

var express = require('express');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false })
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

        app.post("/order/myOrder", function (req, res) {
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
                                discount_price = Math.ceil(price - discount);
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

        app.post("/package/singlePackage", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("package");
            let id = new ObjectId(req.body._id); //make id as object
            console.log(id)
            collection.find({ _id: id }).toArray(function (err, data) {
                if (err || data.length == 0) {
                    console.log(data)
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: data });
                }
            })
        })


        app.post("/package/special/getAll", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("specialPackage");
            collection.find().toArray(function (err, packages) {
                if (err) {
                    res.send({ status: "failed" });
                }
                else {
                    res.send({ status: "done", result: packages });
                }
            })
        })

        app.post("/package/special/edit", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("specialPackage");
            let id = new ObjectId(req.body._id); //make id as object
            let _diamond = req.body.diamond;
            let _topUp_type = req.body.topUp_type;
            let _discount = req.body.discount;
            let _price = req.body.price;
            collection.updateOne(
                { _id: id }, //targeted data
                {
                    $set: {
                        diamond: _diamond,
                        topUp_type: _topUp_type,
                        discount_amount: _discount,
                        price: _price
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

        app.post("/package/special/delete", function (req, res) {
            var collection = myMongoClient.db("FlashShop").collection("specialPackage");
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

        app.post("/package/special/create", function (req, res) {
            const _data = req.body;
            try {
                myMongoClient.db("FlashShop").collection("specialPackage").insertOne(_data);
                res.send({ status: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ status: "failed" })
            }
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

        app.post("/settings/all", function (req, res) {
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



        //--------------------------------------------------------------------------------
        //############################ SEC Attendance Syatem #############################
        //--------------------------------------------------------------------------------

        let exist, success, empName, dayOff;
        function getWeekDay(d, m, y) {
            let todays_date = m + " " + d + ", " + y;
            const t = new Date(todays_date);
            let todays_day = t.getDay()
            const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            return weekday[todays_day];
        }
        function daysInMonth(month, year) {
            let m;
            if (month == "January") { m = 1 }
            if (month == "February") { m = 2 }
            if (month == "March") { m = 3 }
            if (month == "April") { m = 4 }
            if (month == "May") { m = 5 }
            if (month == "June") { m = 6 }
            if (month == "July") { m = 7 }
            if (month == "August") { m = 8 }
            if (month == "September") { m = 9 }
            if (month == "October") { m = 10 }
            if (month == "November") { m = 11 }
            if (month == "December") { m = 12 }
            return new Date(year, m, 0).getDate();
        }
        app.post("/SEC/mark", function (req, res) {
            let empID = req.body.empID;
            let status = req.body.status;
            let day = req.body.day;
            let month = req.body.month;
            let year = req.body.year;
            let time = req.body.time;

            //console.log(getWeekDay(day, month, year));
            let collection_name = year + "_" + month;
            //let collection_name = "aaa";

            myMongoClient.db("SEC").collection("employee").find({ empID: empID }).toArray(function (err, rr) { //find() er vitor obj akare condition o apply kora jay. jemon, {ID : "191-35-2640"}
                empName = "";
                dayOff = "";
                if (err) {
                    console.log("Error fetching data");
                }
                else {
                    empName = rr[0].empName
                    dayOff = rr[0].dayOff
                }
            })

            myMongoClient.db("SEC").listCollections().toArray(function (err, coll) {
                exist = false;
                for (let i = 0; i < coll.length; i++) {
                    if (coll[i].name == collection_name) {
                        exist = true;
                        break;
                    }
                }
                if (!exist) {
                    myMongoClient.db("SEC").createCollection(collection_name);
                }

                let collection = myMongoClient.db("SEC").collection(collection_name);
                collection.find({ empID: empID }).toArray(function (err, data) { //find() er vitor obj akare condition o apply kora jay. jemon, {ID : "191-35-2640"}
                    if (data.length == 0) {
                        let ar = [];
                        for (let i = 0; i < daysInMonth(month, year); i++) {
                            ar[i] = "-";
                        }
                        let _data = {
                            empID, empName, status: ar
                        }
                        myMongoClient.db("SEC").collection(collection_name).insertOne(_data);
                        data.push(_data);
                    }
                    //console.log(data[0].status)
                    //console.log(exist)

                    //NOW SET THE STATUS IN DATA AND UPDATE THAT IN DATABASE
                    //HERE
                    if (status == "Present") {
                        data[0].status[day - 1] = time;
                    }
                    else {
                        data[0].status[day - 1] = status;
                    }

                    //adjust previous DayOff
                    //not mandatory part
                    //comment it out if not nessessary
                    /*for (let i = 1; i < day - 1; i++) {
                        if (data[0].status[i - 1] != "-" && data[0].status[i] == "-" && data[0].status[i + 1] != "-" && getWeekDay(i + 1, month, year) == dayOff) {
                            data[0].status[i] = "Day Off";
                        }
                    }*/

                    myMongoClient.db("SEC").collection(collection_name).updateOne(
                        { empID: empID }, //targeted data
                        {
                            $set: { status: data[0].status }
                        },
                        function (err, r) {
                            success = false;
                            if (err) {
                                //res.send({ status: "failed" })
                            }
                            else {
                                //res.send({ status: "done" })
                                success = true;
                            }
                            let date = day + " " + month + ", " + year;
                            res.send({ empName, empID, success, status, time, date });
                        }
                    )
                })
            });
        })

        app.post("/SEC/checkAttendance", function (req, res) {
            let empID = req.body.empID;
            let day = req.body.day;
            let month = req.body.month;
            let year = req.body.year;

            let collection_name = year + "_" + month;
            myMongoClient.db("SEC").collection(collection_name).find({ empID: empID }).toArray(function (err, r) { //find() er vitor obj akare condition o apply kora jay. jemon, {ID : "191-35-2640"}
                //res.send(r);
                if (r.length == 0) {
                    res.send({ empID, status: "not given" })
                }
                else {
                    if (r[0].status[day - 1] == "-") {
                        res.send({ empID, status: "not given" })
                    }
                    else {
                        res.send({ empID, status: r[0].status[day - 1], date: day + " " + month + ", " + year })
                    }
                }
            })
        })

        app.post("/SEC/allAttendance", function (req, res) {
            let month = req.body.month;
            let year = req.body.year;
            let collection_name = year + "_" + month;
            var collection = myMongoClient.db("SEC").collection(collection_name);
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ result: "failed" });
                }
                else {
                    res.send({ result: "done", month: month + ", " + year, data: data });
                }
            })
        })

        app.post("/SEC/SEC_login", function (req, res) {
            let empID = req.body.empID;
            let password = req.body.password;
            var collection = myMongoClient.db("SEC").collection("employee");
            collection.find({ empID: empID }).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ result: "failed" });
                }
                else {
                    if (data.length != 0) {
                        if (data[0].password == password) {
                            res.send({
                                result: "done",
                                empName: data[0].empName,
                                dayOff: data[0].dayOff,
                                showroom_name: data[0].showroom_name,
                                latitude: data[0].latitude,
                                longitude: data[0].longitude,
                                range: data[0].range
                            });
                        }
                        else {
                            res.send({ result: "not matched" });
                        }
                    }
                    else {
                        res.send({ result: "not matched" });
                    }
                }
            })
        })

        app.post("/SEC/addEmployee", function (req, res) {
            let empName = req.body.empName;
            let empID = req.body.empID;
            let password = req.body.password;
            let dayOff = req.body.dayOff;
            let showroom_name = req.body.showroom_name;
            let latitude = req.body.latitude;
            let longitude = req.body.longitude;
            let range = req.body.range;

            var collection = myMongoClient.db("SEC").collection("employee");
            collection.find({ empID: empID }).toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ result: "failed" });
                }
                else {
                    if (data.length == 0) {
                        //add
                        let employeeData = {
                            empName, empID, password, dayOff, showroom_name, latitude, longitude, range
                        }
                        myMongoClient.db("SEC").collection("employee").insertOne(employeeData);
                        res.send({ result: "done", empID });
                    }
                    else {
                        res.send({ result: "empID already exist" });
                    }
                }
            })
        })

        app.post("/SEC/editEmployee", function (req, res) {
            let empName = req.body.empName;
            let empID = req.body.empID;
            let password = req.body.password;
            let dayOff = req.body.dayOff;
            let showroom_name = req.body.showroom_name;
            let latitude = req.body.latitude;
            let longitude = req.body.longitude;
            let range = req.body.range;

            myMongoClient.db("SEC").collection("employee").updateOne(
                { empID: empID }, //targeted data
                {
                    $set: {
                        empName: empName,
                        password: password,
                        dayOff: dayOff,
                        showroom_name: showroom_name,
                        latitude: latitude,
                        longitude: longitude,
                        range: range
                    }
                },
                function (err, r) {
                    res.send({ empName, empID, password, dayOff, showroom_name, latitude, longitude, range });
                }
            )
        })

        app.post("/SEC/removeEmployee", function (req, res) {
            let empID = req.body.empID;
            var collection = myMongoClient.db("SEC").collection("employee");
            collection.deleteOne(
                { empID: empID }, //targeted data
                function (err, data) {
                    if (err) {
                        res.send({ result: "failed" })
                    }
                    else {
                        res.send({ result: "done" })
                    }
                }
            )
        })

        app.post("/SEC/getAllEmployee", function (req, res) {
            var collection = myMongoClient.db("SEC").collection("employee");
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ result: "failed" });
                }
                else {
                    if (data.length == 0) {
                        res.send({ result: "no employee" });
                    }
                    else {
                        res.send({ result: "found", data });
                    }
                }
            })
        })

        let prevData = [];
        app.post("/SEC/editAttendanceIndividual", function (req, res) {
            let empID = req.body.empID;
            let day = req.body.day;
            let month = req.body.month;
            let year = req.body.year;
            let new_status = req.body.new_status;
            let collection_name = year + "_" + month;
            let collection = myMongoClient.db("SEC").collection(collection_name);
            collection.find({ empID: empID }).toArray(function (err, data) {
                prevData = data[0].status;
                prevData[day - 1] = new_status;
                //res.send(prevData)
                myMongoClient.db("SEC").collection(collection_name).updateOne(
                    { empID: empID }, //targeted data
                    {
                        $set: {
                            status: prevData
                        }
                    },
                    function (err, r) {
                        res.send({ result: "done" });
                    }
                )
            })
        })

        app.post("/SEC/change_Password", function (req, res) {
            let empID = req.body.empID;
            let new_password = req.body.new_password;

            myMongoClient.db("SEC").collection("employee").updateOne(
                { empID: empID }, //targeted data
                {
                    $set: {
                        password: new_password
                    }
                },
                function (err, r) {
                    res.send({ result: "done" });
                }
            )
        })

        app.post("/SEC/showRoomLocation", function (req, res) {
            var collection = myMongoClient.db("SEC").collection("admin");
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ result: "failed" });
                }
                else {
                    res.send(data);
                }
            })
        })

        app.post("/SEC/change_showroom_location", function (req, res) {
            let latitude = req.body.latitude;
            let longitude = req.body.longitude;
            let range = req.body.range;
            var ObjectId = require('mongodb').ObjectId;
            let id = new ObjectId(req.body.id);

            myMongoClient.db("SEC").collection("admin").updateOne(
                { _id: id }, //targeted data
                {
                    $set: {
                        latitude: latitude,
                        longitude: longitude,
                        range: range
                    }
                },
                function (err, r) {
                    res.send({ result: "done" });
                }
            )
        })
        
        app.post("/SEC/add_activity", function (req, res) {
            const _data = req.body;
            try {
                myMongoClient.db("SEC").collection("activity").insertOne(_data);
                res.send({ result: "done" })
            }
            catch (e) {
                console.log(e)
                res.send({ result: "failed" })
            }
        })

        app.post("/SEC/view_activity", function (req, res) {
            var collection = myMongoClient.db("SEC").collection("activity");
            collection.find().toArray(function (err, data) {
                if (err) {
                    console.log("Error selecting data");
                    res.send({ result: "failed" });
                }
                else {
                    res.send(data);
                }
            })
        })
    }
})

app.get("/", function (req, res) {
    res.send("<div style='padding: 25px 5px 20px 5px; font-family:arial'><meta name='viewport' content='width=device-width, initial-scale=1.0'><center><img src='https://www.pngkit.com/png/full/816-8161545_freefire-sticker-garena-free-fire-logo-png.png' width='200'/><h1>Flash server running</h1></center></div>");
})
