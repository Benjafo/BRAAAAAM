import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import createError from "http-errors";
import logger from "morgan";

import authRouter from "./routes/auth.js";
import indexRouter from "./routes/index.js";

import { NextFunction, Request, Response } from "express";

const app = express();

// CORS configuration
app.use(
    cors({
        origin: ["http://localhost:5173"], //TODO: use .env for allowed origins
        credentials: true,
    })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use("/auth", authRouter);

// catch 404 and forward to error handler
app.use(function (_req, _res, next) {
    next(createError(404));
});

// error handler
app.use(function (err: any, req: Request, res: Response, _next: NextFunction) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
});

export default app;
