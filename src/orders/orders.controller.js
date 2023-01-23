const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list (req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  const order = {
      id: nextId(), 
      deliverTo, 
      mobileNumber, 
      status, 
      dishes
  };
  orders.push(order);
  res.status(201).json({ data: order });
}

  function orderExists (req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id == orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404, 
        message: `Order ${orderId} does not exist.`,
    })
}


function bodyDataHas(propertyName) {
  return function (req, res, next) {
      const { data = {} } = req.body
      if(!data[propertyName]) {
          next({ status: 400, message: `Must include a ${propertyName}`})
      } else if(propertyName === "dishes"){
        if(data.dishes.length == 0 || !Array.isArray(data.dishes)){
          next ({
          status: 400,
          message: `Must have at least one dish and must be in an array.`
          })
        }
      }
      return next()
  }
}

function checkDishQuantity(req, res, next){
  const {data: {dishes} = {} } = req.body
  dishes.forEach((dish, index) => {
    if (!dish.quantity || dish.quantity <= 0 || !Number.isInteger(dish.quantity)){
      next({
        status: 400,
        message: `Dish ${index} must have a quantity higher than 0 and be a number.`
      })
    } 
  })
  return next()
}

function checkId(req, res, next){
  const {orderId} = req.params
  const {data: {id} = {} } = req.body
  if (id && id !== orderId){
    next({
      status: 400,
      message: `Dish id (${orderId}) does not match the route (${id}).`
    })
  }
  next()
}

function read(req, res) {
    res.json({data : res.locals.order});
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  
  order.id = res.locals.order.id;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function checkStatus(req, res, next) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  if (!status || status === "" || status === "invalid") {
    return next({
      status: 400,
      message: "Order must have a status.",
    });
  }
  else if (status === "delivered") {
    next({
      status: 400,
      message: "Order cannot be changed after delivery.",
    })
  }
  else {
    return next();
  }
}

function destroy(req, res){
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
  }

  function checkPending(req, res, next){
    const { status } = res.locals.order;
    if (status !== "pending"){
      return next({
        status: 400,
        message: `An order cannot be deleted if it is no longer pending.`
      })
    }
    next()
  }

  module.exports = {
    list,
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        checkDishQuantity,
        create
    ],
    read: [
        orderExists,
        read
    ],
    update: [
      orderExists,
      checkId,
      checkStatus,
      bodyDataHas("deliverTo"),
      bodyDataHas("mobileNumber"),
      bodyDataHas("status"),
      bodyDataHas("dishes"),
      checkDishQuantity,
      update      
    ],
    delete: [
      orderExists,
      checkPending,
      destroy
    ]
  }