const mongoose = require("mongoose");
const { default: validator } = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age should be positive");
        }
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 8,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

// Hash plain text password before saving

userSchema.pre("save", async function (next) {
  const user = this;

  // If the password was modified
  if (user.isModified("password")) {
    const hashedPassword = await bcryptjs.hash(user.password, 8);
    user.password = hashedPassword;
  }

  next();
});

// Generate auth token

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

  user.tokens = user.tokens.concat({ token });

  await user.save();

  return token;
};

// Confirm credentials before login

userSchema.statics.confirmCredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Unable to login");
  }

  const isPasswordMatch = await bcryptjs.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Unable to login");
  }

  return user;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObj = user.toObject();

  delete userObj.tokens;
  delete userObj.password;
  delete userObj.avatar;

  return userObj;
};

const User = new mongoose.model("User", userSchema);

module.exports = User;
