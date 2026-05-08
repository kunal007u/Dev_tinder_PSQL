import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.routes.ts';
import userRoutes from './src/routes/user.routes.ts';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());// Middleware to parse JSON request body
app.use(cookieParser()); // Middleware to parse cookies from the request headers, allowing us to easily access and manipulate cookies in our route handlers. This is essential for handling authentication tokens stored in cookies, such as JWTs, and managing user sessions effectively.

// Mount the Routes
app.use("/", authRoutes);
app.use("/", userRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use((err: any, req: any, res: any, next: any) => {
    console.error("❌ ERROR STACK:", err.stack);
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Something went wrong!'
    });
});
