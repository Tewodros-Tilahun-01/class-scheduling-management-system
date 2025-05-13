const router = require("express").Router();
const Representative = require("../models/Representative");

router.get("/", async (req, res) => {
  res.status(200).json({ message: "ok" });
});
router.get("/getRepresentatives", async (req, res) => {
  try {
    const representatives = await Representative.find();
    res.status(200).json(representatives);
  } catch (err) {
    res.status(500).json(err);
  }
});
router.post("/addRepresentative", async (req, res) => {
  const { name, department, year } = req.body;

  try {
    const newRepresentative = new Representative({
      name,
      department,
      year,
    });
    await newRepresentative.save();
    res.status(201).json({ message: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.put("/updateRepresentative/:id", async (req, res) => {
  const { name, department, year } = req.body;

  try {
    const updatedRepresentative = await Representative.findByIdAndUpdate(
      req.params.id,
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

module.exports = router;
