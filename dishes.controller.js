const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//GET "/dishes"
function list(req, res, next) {
  res.json({ data: dishes });
}

//Validation
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish include a ${propertyName}` });
  };
}

function nameIsValid(req, res, next) {
  const { name } = req.body.data;
  if (name.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a name`,
  });
}

function descriptionIsValid(req, res, next) {
  const { description } = req.body.data;
  if (description.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a description`,
  });
}

function priceIsValid(req, res, next) {
  const { price } = req.body.data;
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
}

function imageUrlIsValid(req, res, next) {
  const { image_url } = req.body.data;
  if (image_url.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a image_url`,
  });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
  
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    }
    next({
      status: 404,
      message: `Dish does not exist: ${dishId}`,
    });
  }

  function idMatcher(req, res, next) {
    const { dishId } = req.params;
    const { id } = req.body.data;
    if(id && id !== dishId) {
      return next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
      });
    }
    next();
  }

//POST "/dishes"
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

//GET "/dishes/:dishId"
function read(req, res) {
    res.status(200).json({ data: res.locals.dish });
}

//UPDATE "/dishes/:dishId"
function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({data: dish })
}


module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    nameIsValid,
    descriptionIsValid,
    priceIsValid,
    imageUrlIsValid,
    create
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    idMatcher,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    nameIsValid,
    descriptionIsValid,
    priceIsValid,
    imageUrlIsValid,
    update
  ]
};
