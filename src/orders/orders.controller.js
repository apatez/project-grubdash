const path = require("path");
 
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));
 
// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");
 
// TODO: Implement the /orders handlers needed to make the tests pass
 
//Validation middleware
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
 
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    }
    next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  }
 
function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Order include a ${propertyName}` });
    };
  }


 function validateOrder(req, res, next) {
	const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
	let message;
	if(!deliverTo || deliverTo === "")
		message = "Order must include a deliverTo";
	else if(!mobileNumber || mobileNumber === "")
		message = "Order must include a mobileNumber";
	else if(!dishes)
		message = "Order must include a dish";
	else if(!Array.isArray(dishes) || dishes.length === 0)
		message = "Order must include at least one dish";
	else {
		for(let idx = 0; idx < dishes.length; idx++) {
			if(!dishes[idx].quantity || dishes[idx].quantity <= 0 || !Number.isInteger(dishes[idx].quantity))
				message = `Dish ${idx} must have a quantity that is an integer greater than 0`;
		}
	}
	if(message) {
		return next({
			status: 400,
			message: message,
		});
	}
	next();
}
 

function statusIsValid(req, res, next) {
  const { status } = req.body.data;
  const invalidStatus = ["invalid", "delivered"]
  if(!status || status.length === 0) {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    })
  } 
  if (status !== "pending") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    })
  }
  next();
}
 
function idMatcher(req, res, next) {
    const { orderId } = req.params;
    const { id } = req.body.data;
    if(id && id !== orderId) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
      });
    }
    next();
  }
 
function orderStatus(req, res, next) {
  const { order } = res.locals
  if(order.status === "pending") {
    return next()
  }
  next({
    status: 400,
    message: `An order cannot be deleted unless it is pending. Returns a 400 status code`
  })
}
//GET "/orders"
 
function list(req, res, next) {
    res.status(200).json({ data: orders });
  }
 
// POST "/orders"
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}
 
//GET /orders/:orderId
function read(req, res) {
    res.status(200).json({ data: res.locals.order });
}
 
//PUT /orders/:orderId
function update(req, res) {
   const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
 
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
 
    res.json({data: order })
}
 
 
//DELETE /orders/:orderId
function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    if (index > -1) {
      orders.splice(index, 1);
    }
    res.sendStatus(204);
  }

 
  module.exports = {
    list,
    read: [orderExists, read],
    create: [validateOrder, create],
    update: [orderExists, idMatcher, validateOrder, statusIsValid, update],
    destroy: [orderExists, orderStatus, destroy]
  };
