import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send({
    message: "Hello World!",
    data: {
      name: "John Doe",
      age: 30,
    },
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
