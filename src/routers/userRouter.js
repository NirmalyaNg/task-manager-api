const express = require("express");
const sharp = require("sharp");
const multer = require("multer");
const User = require("../models/User");

const auth = require("../middlewares/auth");
const { sendWelcomeMail, sendCancellationEmail } = require("../emails/email");

const router = express.Router();

// Create a user
router.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);

    const token = await user.generateAuthToken();
    await sendWelcomeMail(user.email, user.name);

    res.status(201).send({
      user,
      token,
    });
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

// Login an user
router.post("/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.confirmCredentials(email, password);

    const token = await user.generateAuthToken();

    res.send({ user, token });
  } catch (error) {
    res.status(404).send({
      message: error.message,
    });
  }
});

// Read profile data
router.get("/users/profile", auth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(500).send();
  }
});

// Upload avatar

const avatar = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|JPG|JPEG)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  avatar.single("avatar"),
  async (req, res) => {
    try {
      const user = req.user;

      const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .png()
        .toBuffer();
      user.avatar = buffer;

      await user.save();
      res.send();
    } catch (error) {
      res.status(500).send();
    }
  },
  (error, req, res, next) => {
    res.status(400).send({
      error: error.message,
    });
  }
);

// Remove avatar

router.delete("/users/me/avatar", auth, async (req, res) => {
  try {
    const user = req.user;
    user.avatar = undefined;

    await user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

// Update profile data

router.patch("/users/profile", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["name", "age", "email", "password"];

    const isValidUpdate = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidUpdate) {
      throw new Error("Invalid Updates");
    }

    const user = req.user;

    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    await user.save();

    res.send(user);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

// Get profile pic of a user

router.get("/users/:id/avatar", async (req, res) => {
  try {
    const id = req.params.id;

    const user = await User.findById(id);

    if (!user || !user.avatar) {
      res.status(404).send();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(500).send();
  }
});

// Logout

router.post("/users/logout", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = user.tokens.filter((token) => {
      return token.token !== req.token;
    });

    await user.save();
    res.send({
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).send();
  }
});

// Logout All

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    const user = req.user;
    user.tokens = [];

    await user.save();

    res.send({
      message: "Logged out from all devices",
    });
  } catch (error) {
    res.status(500).send();
  }
});

// Delete Profile

router.delete("/users/profile", auth, async (req, res) => {
  try {
    const user = req.user;
    await user.remove();

    sendCancellationEmail(user.email, user.name);

    res.send({
      message: "Profile deleted successfully",
    });
  } catch (error) {
    res.status(500).send();
  }
});

module.exports = router;
