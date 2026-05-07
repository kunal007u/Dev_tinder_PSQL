import express from 'express';
import { prisma } from './src/config/client.ts';
import { validateSignupData } from './src/utils/validateSignupData.ts';
import bcrypt from 'bcrypt';
import { jwtTokenGeneration } from './src/utils/tokenGeneration.ts';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './src/middlewares/auth.middleware.ts';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());// Middleware to parse JSON request body
app.use(cookieParser()); // Middleware to parse cookies from the request headers, allowing us to easily access and manipulate cookies in our route handlers. This is essential for handling authentication tokens stored in cookies, such as JWTs, and managing user sessions effectively.

// GET /api/v1/users - Retrieve all users
app.get("/api/v1/users", authMiddleware, async (req, res) => {
    // we got middleware authMiddleware that checks the token and verify it
    try {
        const users = await prisma.user.findMany({});
        res.json({ message: "Users Retrieved Successfully", users });
    }
    catch (error: any) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
})

// POST /api/v1/users - Create a new user
app.post("/api/v1/users", authMiddleware, async (req, res) => {
    const { firstName, lastName, email, age, gender, password } = req.body;

    let isUserExist = await prisma.user.findUnique({
        where: { email }
    })
    if (isUserExist) {
        return res.status(400).json({ message: "User Already Exists" });
    }
    // Validating the data coming from the client before processing it
    validateSignupData(req.body)

    // encrypting the password before saving to database
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    try {
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                age,
                gender,
                password: hashPassword
            },
            omit: {
                password: true
            }
        });
        let token = jwtTokenGeneration({ user });
        res.status(201).json({ message: "User Created Successfully", user });
    }
    catch (error: any) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
})

// POST /api/v1/login - Authenticate a user and create a session
app.post("/api/v1/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        let hasToken = req.cookies.token ? true : false;

        if (hasToken) {
            return res.status(400).json({ message: "User Already Logged In" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid Credentials" });
        }

        // create a token to maintain the session of the user
        // const token = jwt.sign({ user }, process.env.JWT_SECRET_KEY as string, { expiresIn: '1h' });
        let token = jwtTokenGeneration({ user });
        // httpOnly: true - to prevent client-side JavaScript from accessing the cookie, enhancing security against XSS attacks.
        // secure: true - to ensure the cookie is only sent over HTTPS connections, enhancing security.
        // sameSite: 'strict' - to prevent the browser from sending the cookie along with cross-site requests, providing protection against CSRF attacks.
        // res.cookie("token", token, { httpOnly: true, secure: true, sameSite: 'strict' }); // -- for production --
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: 'strict' }); // -- for development --

        res.json({ message: "Login Successful", user });
    }
    catch (error: any) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
})

// DELETE /api/v1/users/:id - Delete a user by ID
app.delete("/api/v1/users/:id", authMiddleware, async (req, res) => {
    const { id } = req.params;
    if (!Number(id)) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ message: "User Deleted Successfully" });
    } catch (error: any) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
})

// POST /api/v1/logout - Clear the authentication token cookie to log out the user
app.post("/api/v1/logout", authMiddleware, (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production', // Matches your login logic
        sameSite: 'strict',
        // path: '/' // Ensure the path matches the original cookie path if specified during login
    });
    res.status(200).json({ message: "Logout Successful" });
})

// update user details
app.patch("/api/v1/users/:id", authMiddleware, async (req, res) => {
    let { id } = req.params;

    if (!Number(id)) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const { firstName, lastName, email, age, gender } = req.body;
    try{
        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: {
                firstName,
                lastName,
                email,
                age,
                gender
            },
            omit: {
                password: true
            }
        });
        res.json({ message: "User Updated Successfully", updatedUser });
    }
    catch (error: any) {
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});