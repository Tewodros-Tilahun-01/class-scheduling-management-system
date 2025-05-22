const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

function authMiddleware(req, res, next) {
  if (!req.cookies || !req.cookies.token) {
    console.log("No token found");
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = req.cookies.token;
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(err.message);
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  });
}

module.exports = authMiddleware;
