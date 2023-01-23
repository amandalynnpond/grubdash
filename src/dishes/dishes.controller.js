const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");



// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res) {
    res.json({ data: dishes });
  }

  function dishExists (req, res, next){
    const {dishId} = req.params;
    const foundDish = dishes.find((dish) => dishId === dish.id)
    if (foundDish){
      res.locals.dish = foundDish;
      next();
    }else{
      next({
        status: 404,
        message: `Dish with id ${dishId} does not exist.`
      })
    } 
  }

  function read(req, res, next){
    res.json({ data: res.locals.dish})
  }

  function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body
        if(!data[propertyName]) {
            next({ status: 400, message: `Must include a ${propertyName}`})
        } else if(propertyName === "price"){
          if(data.price <= 0 || !Number.isInteger(data.price)){
            next ({
            status: 400,
            message: `Dish price must be a number and have a value higher than 0.`
            })
          }
        }
        return next()
    }
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
      id: nextId(), 
      name, 
      description, 
      price, 
      image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function checkId(req, res, next){
  const {dishId} = req.params
  const {data: {id} = {} } = req.body
  if (id && id !== dishId){
    next({
      status: 400,
      message: `Dish id (${dishId}) does not match the route (${id}).`
    })
  }
  next()
}

function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}



  module.exports = {
    list,
    read: [dishExists, read],
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        create
    ],
    update: [
      dishExists,
      checkId,
      bodyDataHas("name"),
      bodyDataHas("description"),
      bodyDataHas("price"),
      bodyDataHas("image_url"),
      update      
    ]
  }