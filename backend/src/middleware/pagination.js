import { config } from "../config/runtimeConfig.js";

export const pagination = (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || config.request.defaultPageLimit;
  const skip = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    skip
  };

  next();
};
