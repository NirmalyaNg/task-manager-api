const express = require("express");

require("./db/mongoose");

const userRouter = require("./routers/userRouter");
const taskRouter = require("./routers/taskRouter");

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
