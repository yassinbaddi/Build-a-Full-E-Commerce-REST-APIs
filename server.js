const express = require("express");
const morgan = require("morgan");
const { startServer } = require("./config/database.js");
const app = express();
const { router: categoryRouter } = require("./routes/categoryRoute.js");
const { router: subCategoryRouter } = require("./routes/subCategoryRoute.js");
const { router: productRouter } = require("./routes/productRoute.js");
const { router: userRouter } = require("./routes/userRoute.js");
const { router: authRouter } = require("./routes/authRoute.js");
const ApiError = require("./utils/apiError.js");
const errorHandler = require("./middleware/errorMiddleware.js");
const path = require('path')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'uploads')))


if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`Node: ${process.env.NODE_ENV}`);
}

app.get("/", (req, res) => {
  res.send("Our API");
});
const paymentRoute = require("./routes/paymentRoute");

app.use("/categories", categoryRouter);
app.use("/subcategories", subCategoryRouter);
app.use("/products", productRouter);
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/api/payments", paymentRoute);


// const {forgotPassword} = require('./services/authService.js')
// app.get("/test", forgotPassword, (req, res) => {
//     res.json({ message: "Protected route reached" });
// });




app.all("/{*splat}", (req, res, next) => {
  const err = new ApiError(`Can't find this route: ${req.originalUrl}`, 404);
  next(err);
});


app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startApp = async () => {
  try {
    await startServer();

    app.listen(PORT, () => {
      console.log(`App running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
};

startApp();

process.on("exit", (code) => {
  console.log(`Process exited with code: ${code}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});
