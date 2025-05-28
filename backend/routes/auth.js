const { Router } = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Representative = require("../models/Representative");
const e = require("express");

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.isDeleted) {
      return res.status(403).json({ message: "Account is deleted" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  res.cookie(
    "token",
    "logout",
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    },
    { expires: new Date(0) }
  ); // Set cookie to expire immediately
  res.status(200).json({ message: "Logged out" });
});

router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    console.log("No token found");
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(err.message);
      return res.status(401).json({ message: "Unauthorized" });
    }
    User.findById(decoded.id)
      .then((user) => {
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
        });
      })
      .catch((error) => {
        res.status(500).json({ message: "Server error" });
      });
  });
});
router.post("/verify", async (req, res, next) => {
  const { token } = req.body;
  console.log("Token received for verification:", token);
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const representative = await Representative.findOne({
        _id: decoded.id,
      }).populate("studentGroup");
      if (!representative) {
        return res.status(404).json({ message: "Representative not found" });
      }
      res.status(200).json({ user: representative });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });
});
module.exports = router;
