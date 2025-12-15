// Authentication middleware: verifies JWT and attaches `userId` to the request.
import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    // Require a Bearer token in the `Authorization` header.
    if (!header || !header.startsWith("Bearer ")) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set");
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Make the user ID available to downstream handlers.
    req.userId = decoded.userId;
    next();
  } catch (error) {
    // Normalize unknown errors into a 401 Unauthorized response.
    if (!error.status) {
      error.status = 401;
      error.message = "Unauthorized";
    }
    next(error);
  }
};

export default auth;


