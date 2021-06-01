const mongoose = require("mongoose");

const connectToDB = async () => {
  await mongoose.connect(
    process.env.MONGODB_URL,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    },
    () => {
      console.log("Connected to DB");
    }
  );
};

connectToDB();
