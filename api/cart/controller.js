const Cart = require("../../models/cart");
const Laptop = require("../../models/laptop");
const PURCHASE = require("../../models/purchase");
const { successResponse } = require("../../libs/responseMessage/success");
const { errorResponse } = require("../../libs/responseMessage/error");

exports.addToCart = async (req, res) => {
  try {
    const { laptopId, quantity } = req.body;
    const userId = req.user.id;

    let cart = await Cart.findOne({ user: userId });
    let laptop = await Laptop.findById(laptopId);

    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.laptop.toString() === laptopId
    );
    let totalQuantity = quantity;
    if (existingItemIndex >= 0) {
      totalQuantity += cart.items[existingItemIndex].quantity;
    }
    if (totalQuantity > laptop.count) {
      return errorResponse(
        res,
        "You have already added the maximum quantity to the cart",
        400
      );
    }
    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({ laptop: laptopId, quantity });
    }

    await cart.save();
    return successResponse(res, "Item added to cart successfully", cart);
  } catch (err) {
    console.log(err);

    return errorResponse(res, err);
  }
};
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.laptop",
      select: "title brand model price images",
    });

    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }

    const updatedItems = cart.items.map((item) => {
      if (item.laptop !== null) {
        const laptopObj = item.laptop.toObject?.() || item.laptop;
        return {
          ...laptopObj,
          quantity: item.quantity,
        };
      } else {
        return null;
      }
    });

    return successResponse(res, "Cart fetched successfully", {
      ...cart.toObject(),
      items: updatedItems,
    });
  } catch (err) {
    return errorResponse(res, err);
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { laptopId, quantity } = req.body;
    const userId = req.user._id;

    // Find the cart for the current user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }
    // Check if the laptop exists in the laptop table
    const laptop = await Laptop.findById(laptopId);
    if (!laptop) {
      return errorResponse(res, "Laptop not found", 404);
    }
    console.log(quantity, laptop);

    // Check if the requested quantity is available in the laptop table
    if (quantity > laptop.count) {
      return errorResponse(res, "Not enough stock available", 400);
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.laptop.toString() === laptopId
    );

    if (itemIndex >= 0) {
      if (quantity <= 0) {
        // Remove the item if the quantity is zero or less
        cart.items.splice(itemIndex, 1);
      } else {
        // Update the quantity in the cart
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
      return successResponse(res, "Cart updated successfully", cart);
    } else {
      return errorResponse(res, "Item not found in cart", 404);
    }
  } catch (err) {
    return errorResponse(res, err);
  }
};

exports.checkout = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.laptop",
    });

    if (!cart || cart.items.length === 0) {
      return errorResponse(res, "Cart is empty", 400);
    }

    for (const item of cart.items) {
      const laptop = item.laptop;
      const quantity = item.quantity;

      if (!laptop || !laptop.isAvailable) {
        return errorResponse(
          res,
          `Laptop "${laptop.title}" is not available`,
          404
        );
      }

      if (laptop.count < quantity) {
        return errorResponse(
          res,
          `Not enough stock for laptop "${laptop.title}"`,
          400
        );
      }

      laptop.count -= quantity;
      if (laptop.count <= 0) {
        laptop.isAvailable = false;
      }

      await laptop.save();

      const newOrder = new PUECHASE({
        user: userId,
        laptop: laptop._id,
        quantity: quantity,
      });
      await newOrder.save();
    }

    cart.items = [];
    await cart.save();

    return successResponse(res, "Checkout successful, all items purchased!");
  } catch (err) {
    return errorResponse(res, err);
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const { laptopId } = req.params;
    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return errorResponse(res, "Cart not found", 404);
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.laptop.toString() === laptopId
    );

    if (itemIndex >= 0) {
      cart.items.splice(itemIndex, 1);
      await cart.save();
      return successResponse(res, "Item removed from cart successfully", cart);
    } else {
      return errorResponse(res, "Item not found in cart", 404);
    }
  } catch (err) {
    return errorResponse(res, err);
  }
};
exports.buyAllItems = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the cart for the user
    const cart = await Cart.findOne({ user: userId }).populate({
      path: "items.laptop",
    });

    // Check if the cart is empty
    if (!cart || cart.items.length === 0) {
      return errorResponse(res, "Cart is empty", 400);
    }

    // Iterate over each item in the cart and process the checkout
    for (const item of cart.items) {
      const laptop = item.laptop;
      const quantity = item.quantity;

      // Check if the laptop is available
      if (!laptop || !laptop.isAvailable) {
        return errorResponse(
          res,
          `Laptop "${laptop.title}" is not available`,
          404
        );
      }

      // Check if there's enough stock
      if (laptop.count < quantity) {
        return errorResponse(
          res,
          `Not enough stock for laptop "${laptop.title}"`,
          400
        );
      }

      // Deduct the quantity from the stock
      laptop.count -= quantity;
      if (laptop.count <= 0) {
        laptop.isAvailable = false;
      }

      await laptop.save();

      // Create a new order for each item in the cart
      const newOrder = new PURCHASE({
        user: userId,
        laptop: laptop._id,
        quantity: quantity,
      });
      await newOrder.save();
    }

    // After processing all items, clear the cart
    cart.items = [];
    await cart.save();

    // Respond to the client that the purchase was successful
    return successResponse(res, "All items purchased successfully!");
  } catch (err) {
    console.log(err);
    return errorResponse(res, err);
  }
};

exports.buySelectedItem = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user._id;

    if (!items || items.length === 0) {
      return errorResponse(res, "No items selected", 404);
    }

    let finalPrice = 0;
    const laptopEntries = [];

    for (const item of items) {
      const laptop = await Laptop.findById(item.laptopId);
      if (!laptop) {
        return errorResponse(
          res,
          `Laptop with ID ${item.laptopId} not found`,
          404
        );
      }

      if (laptop.count < item.quantity) {
        return errorResponse(res, `Not enough stock for ${laptop.name}`, 400);
      }

      // Decrease stock
      laptop.count -= item.quantity;
      await laptop.save();

      const unitPrice = laptop.price;
      const totalPrice = unitPrice * item.quantity;
      finalPrice += totalPrice;

      laptopEntries.push({
        laptop: laptop._id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      });

      // ✅ Remove from cart
      await Cart.updateOne(
        { user: userId },
        { $pull: { items: { laptop: laptop._id } } }
      );
    }

    const purchase = new PURCHASE({
      user: userId,
      laptops: laptopEntries,
      finalPrice,
      status: "pending", // or use EstatusOptions.PENDING
    });

    await purchase.save();

    return successResponse(res, "Items purchased successfully", purchase);
  } catch (err) {
    console.error(err);
    return errorResponse(res, err.message || "Something went wrong", 500);
  }
};
