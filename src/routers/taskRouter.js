const express = require("express");
const auth = require("../middlewares/auth");
const Task = require("../models/Task");
const router = express.Router();

// Create a task

router.post("/tasks", auth, async (req, res) => {
  try {
    const task = new Task(req.body);
    const userId = req.user._id;

    task.owner = userId;

    await task.save();

    res.status(201).send(task);
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});

// Get a task by id

router.get("/tasks/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;

    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, owner: userId });

    if (!task) {
      return res.status(404).send({
        message: "Unable to fetch task",
      });
    }

    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

// tasks?completed=true
// tasks?completed=false
// tasks?limit=2&skip=2
// tasks?sortyBy=createdAt_asc
// tasks?sortyBy=createdAt_desc

router.get("/tasks", auth, async (req, res) => {
  try {
    const match = {};
    const sort = {};

    if (req.query.sortBy) {
      const parts = req.query.sortBy.split("_");

      sort[parts[0]] = parts[1] === "asc" ? 1 : -1;
    }

    if (req.query.completed) {
      match.completed = req.query.completed === "true";
    }

    const user = req.user;

    await user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
        },
      })
      .execPopulate();
    res.send(user.tasks);
  } catch (error) {
    res.status(500).send();
  }
});

// Update a task by id

router.patch("/tasks/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, owner: userId });

    if (!task) {
      return res.status(404).send({
        message: "Unable to update",
      });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ["description", "completed"];

    const isUpdateAllowed = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isUpdateAllowed) {
      return res.status(400).send({
        message: "Invalid Updates",
      });
    }

    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    await task.save();

    res.send(task);
  } catch (error) {
    res.status(500).send();
  }
});

// Delete a task by id

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: id, owner: userId });

    if (!task) {
      return res.status(404).send({
        message: "Unable to delete",
      });
    }

    await task.remove();

    res.send(task);
  } catch (error) {}
});

module.exports = router;
