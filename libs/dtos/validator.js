const Joi = require("joi");
const { EUserRole, EstatusOptions } = require("../../utils/enum");

exports.createUserSchemaValicator = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  userName: Joi.string().required(),
  age: Joi.number().min(18).required(),
  email: Joi.string().email().required(),
  phoneNo: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  address: Joi.string().required(),
  country: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  poBoxNumber: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  password: Joi.string()
    .min(8)
    .regex(/[A-Za-z0-9@#$%^&+=]/)
    .required(),

  role: Joi.string()
    .valid(...Object.values(EUserRole))
    .optional(),
}).unknown(true);

exports.userLoginSchemaValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required().min(4),
});

// Define validation schema for laptop data
exports.laptopSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title is required.",
  }),
  brand: Joi.string().required().messages({
    "string.empty": "Brand is required.",
  }),
  model: Joi.string().required().messages({
    "string.empty": "Model is required.",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a valid number.",
    "number.positive": "Price must be greater than zero.",
    "any.required": "Price is required.",
  }),
  condition: Joi.string().valid("new", "used").required().messages({
    "any.only": "Condition must be either 'new' or 'used'.",
  }),
  description: Joi.string().allow(null, "").messages({
    "string.base": "Description must be a string.",
  }),
  specifications: Joi.object({
    processor: Joi.string().required().messages({
      "string.empty": "Processor is required.",
    }),
    ram: Joi.string().required().messages({
      "string.empty": "RAM is required.",
    }),
    storage: Joi.string().required().messages({
      "string.empty": "Storage is required.",
    }),
    display: Joi.string().required().messages({
      "string.empty": "Display information is required.",
    }),
    gpu: Joi.string().allow(null, "").messages({
      "string.base": "GPU must be a string.",
    }),
    batteryLife: Joi.string().allow(null, "").messages({
      "string.base": "Battery life must be a string.",
    }),
    os: Joi.string().required().messages({
      "string.empty": "Operating system is required.",
    }),
  }).required(),
  count: Joi.number().integer().min(0).messages({
    "number.base": "Count must be a number.",
    "number.min": "Count cannot be negative.",
  }),
});

// Export validation middleware
exports.validateLaptop = (req, res, next) => {
  const { error } = laptopSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      details: error.details.map((err) => err.message),
    });
  }
  next();
};

// Define validation schema for complaint data
exports.ComplaintSchema = Joi.object({
  description: Joi.string().required().messages({
    "string.empty": "description is required.",
  }),
});
