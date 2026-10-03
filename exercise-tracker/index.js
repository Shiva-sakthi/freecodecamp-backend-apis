const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// In-memory data storage
const users = [];
const exercises = [];

// 1. POST /api/users -> Create a new user
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const newUser = {
    username: username,
    _id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
  };
  users.push(newUser);
  res.json(newUser);
});

// 2. GET /api/users -> Get all users
app.get("/api/users", (req, res) => {
  res.json(users);
});

// 3. POST /api/users/:_id/exercises -> Add an exercise for a user
app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const user = users.find((u) => u._id === userId);

  if (!user) {
    return res.json({ error: "User not found" });
  }

  const description = req.body.description;
  const duration = parseInt(req.body.duration);

  // Date must be formatted as toDateString() (e.g., "Mon Jan 01 1990")
  let dateObj = req.body.date ? new Date(req.body.date) : new Date();
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }
  const dateString = dateObj.toDateString();

  const newExercise = {
    userId: user._id,
    description: description,
    duration: duration,
    date: dateString,
    rawDate: dateObj,
  };
  exercises.push(newExercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: dateString,
    duration: duration,
    description: description,
  });
});

// 4. GET /api/users/:_id/logs -> Retrieve exercise logs with optional filters
app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const user = users.find((u) => u._id === userId);

  if (!user) {
    return res.json({ error: "User not found" });
  }

  const { from, to, limit } = req.query;
  let userExercises = exercises.filter((ex) => ex.userId === userId);

  if (from) {
    const fromDate = new Date(from);
    userExercises = userExercises.filter((ex) => ex.rawDate >= fromDate);
  }

  if (to) {
    const toDate = new Date(to);
    userExercises = userExercises.filter((ex) => ex.rawDate <= toDate);
  }

  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit));
  }

  const log = userExercises.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date,
  }));

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
