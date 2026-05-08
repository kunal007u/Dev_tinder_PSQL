import express from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { prisma } from '../config/client.ts';
import bcrypt from 'bcrypt';
import { jwtTokenGeneration } from '../utils/tokenGeneration.ts';
import { validateSignupData } from '../utils/validateSignupData.ts';

const route = express.Router();

// POST /api/v1/users - Create a new user
route.post("/api/v1/users", authMiddleware, async (req, res, next) => {
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
        // res.status(500).json({ message: "Internal Server Error", error: error.message })
        next(error);
    }
})

// POST /api/v1/login - Authenticate a user and create a session
route.post("/api/v1/login", async (req, res, next) => {
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
        // res.status(500).json({ message: "Internal Server Error", error: error.message })
        next(error);
    }
})

// POST /api/v1/logout - Clear the authentication token cookie to log out the user
route.post("/api/v1/logout", authMiddleware, (req, res, next) => {
    try {

        res.clearCookie("token", {
            httpOnly: true,
            // secure: process.env.NODE_ENV === 'production', // Matches your login logic
            sameSite: 'strict',
            // path: '/' // Ensure the path matches the original cookie path if specified during login
        });
        res.status(200).json({ message: "Logout Successful" });
    } catch (error: any) {
        // res.status(500).json({ message: "Internal Server Error", error: error.message })
        next(error);
    }
})

export default route;

