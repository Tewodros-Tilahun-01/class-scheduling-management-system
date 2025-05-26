const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const PersonalInformation = require("../models/PersonalInformation");
const Representative = require("../models/Representative");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Notification = require("../models/Notification");

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/", async (req, res) => {
  const { username, password, role, name } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.find({ $or: [{ username }] });
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      role,
      name,
    });
    const userInfo = new PersonalInformation({
      user: newUser._id,
    });
    await newUser.save();
    await userInfo.save();

    res.status(201).json({ message: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/:id", async (req, res) => {
  const { username, password, role, name } = req.body;

  try {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        username,
        password: hashedPassword,
        role,
        name,
      },
      { new: true }
    );
    res.status(200).json({ message: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/changepassword/:id", async (req, res) => {
  const { current, new: newPassword } = req.body;
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/personalinfo/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const personalInfo = await PersonalInformation.findOne({
      user: id,
    }).populate("user");

    if (!personalInfo) {
      return res
        .status(404)
        .json({ message: "Personal information not found for this user." });
    }

    res.status(200).json(personalInfo);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/personalinfo", async (req, res) => {
  try {
    const user = new PersonalInformation(req.body);
    await user.save();
    res.status(201).json({ message: "Personal information saved", user });
  } catch (error) {
    console.error("Error saving personal information:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/personalinfo/:id", async (req, res) => {
  const personal_info = req.body;
  const { id } = req.params;

  try {
    const updatedInfo = await PersonalInformation.findOneAndUpdate(
      { user: id },
      { $set: personal_info },
      { new: true }
    );

    if (!updatedInfo) {
      return res
        .status(404)
        .json({ message: "Couldn't find personal information for the user" });
    }

    res
      .status(200)
      .json({ message: "Updated successfully", data: updatedInfo });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.get("/notifications/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const notifications = await Notification.find({
      $or: [
        { recipientId: id },
        { recipientRole: user.role, recipientId: null },
      ],
    }).sort({
      timestamp: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/:id", (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    });
});
module.exports = router;
