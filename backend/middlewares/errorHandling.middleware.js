import { StatusCodes } from "http-status-codes";
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const customError = {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong try again later",
  };

  res.status(customError.statusCode).json({ msg: customError.msg });
};
