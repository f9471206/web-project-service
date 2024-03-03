const Joi = require("joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(5).max(50).required().email(),
    password: Joi.string().min(5).max(30).required(),
    role: Joi.string().default("member"),
  });
  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(50).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });
  return schema.validate(data);
};

const postValidation = (data) => {
  const schema = Joi.object({
    content: Joi.string().min(1).max(1024).required(),
  });
  return schema.validate(data);
};

const replyValidation = (data) => {
  const schema = Joi.object({
    content: Joi.string().min(1).max(1024).required(),
  });
  return schema.validate(data);
};

//註冊
module.exports.registerValidation = registerValidation;

//登入
module.exports.loginValidation = loginValidation;

//貼文
module.exports.postValidation = postValidation;

//留言
module.exports.replyValidation = replyValidation;
