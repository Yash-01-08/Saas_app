import dotenv from "dotenv";

dotenv.config();

const { default: app } = await import("./app.js");
const { connectToMongoDB } = await import("./config/db.js");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        console.log("MongoDB URI loaded:", Boolean(process.env.MONGO_URI));

        await connectToMongoDB();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Error starting the server:", error.message);
        process.exit(1);
    }
};

startServer();