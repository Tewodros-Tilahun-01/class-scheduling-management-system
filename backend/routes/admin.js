const router = require("express").Router();
const jwt = require("jsonwebtoken");
const Representative = require("../models/Representative");
const RepresentativeSession = require("../models/RepresentativeSession");
const StudentGroup = require("../models/StudentGroup");

router.get("/", async (req, res) => {
  res.status(200).json({ message: "ok" });
});
router.get("/getRepresentatives", async (req, res) => {
  try {
    const representatives = await Representative.find().populate(
      "studentGroup"
    );

    const newReps = representatives.map((rep) => {
      return {
        name: rep.name,
        year: rep.studentGroup.year,
        department: rep.studentGroup.department,
        section: rep.studentGroup.section,
        _id: rep._id,
      };
    });

    res.status(200).json(newReps);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.post("/addRepresentative", async (req, res) => {
  const { name, department, year, section } = req.body;

  try {
    // First check if a student group exists with these details
    const studentGroup = await StudentGroup.findOne({
      department: { $regex: new RegExp(`^${department}$`, "i") },
      year,
      section: { $regex: new RegExp(`^${section}$`, "i") },
    });

    if (!studentGroup) {
      return res.status(404).json({
        message:
          "No student group found with the provided department, year and section",
      });
    }
    const rep = await Representative.findOne({
      studentGroup: studentGroup._id,
    });
    if (rep) {
      return res.status(400).json({ message: "Representative already exists" });
    }

    const newRepresentative = new Representative({
      name,
      studentGroup: studentGroup._id,
    });

    await newRepresentative.save();
    res.status(201).json({ message: "Representative added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/updateRepresentative/:id", async (req, res) => {
  const { name, department, year } = req.body;
  const { id } = req.params;

  try {
    await Representative.findByIdAndUpdate(
      id,
      {
        name,
        department,
        year,
      },
      { new: true }
    );
    res.status(200).json({ message: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.delete("/deleteRepresentative/:id", async (req, res) => {
  try {
    await Representative.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Representative deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/getRepresentative/:id", (req, res) => {
  Representative.findById(req.params.id)
    .then((representative) => {
      if (!representative) {
        return res.status(404).json({ message: "Representative not found" });
      }
      res.json(representative);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    });
});
router.get("/generateLinkForReps/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const representative = await Representative.findById(id);

    if (!representative) {
      return res.status(404).json({ message: "Representative not found" });
    }

    const key_token = jwt.sign(
      {
        id: representative._id,
      },

      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    const representativeSession = await RepresentativeSession.findOne({
      rep_id: representative._id,
    });

    if (representativeSession) {
      await RepresentativeSession.findByIdAndUpdate(
        representativeSession._id,
        { token: key_token },
        { new: true }
      );
    } else {
      const representativeSession = new RepresentativeSession({
        rep_id: representative._id,
        token: key_token,
      });
      await representativeSession.save();
    }

    res.status(200).json({ token: key_token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
