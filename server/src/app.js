import express from "express";
import dotenv from "dotenv";
import cors from "cors";    
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import   errorHandler  from "./middlewares/error.middleware.js";
import  notFound  from "./middlewares/notFound.middleware.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import sprintRoutes from "./routes/sprint.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import rateLimiterMiddleware from "./middlewares/rateLimiter.middleware.js";
import fileRoutes from "./routes/file.routes.js";
const app = express();
app.use(express.json());



app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))


app.use(cookieParser());

app.use(rateLimiterMiddleware);  

app.get("/api/health", (req, res) => {
    res.json("Hello World!");
});





app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/sprints", sprintRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/files", fileRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;