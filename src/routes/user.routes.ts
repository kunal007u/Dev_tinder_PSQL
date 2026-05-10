import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.ts';
import { prisma } from '../config/client.ts';
import { validateSignupData } from '../utils/validateSignupData.ts';
import bcrypt from 'bcrypt';

const route = express.Router();

// POST /api/v1/users - Create a new user
route.post("/api/v1/users", authMiddleware, async (req, res, next) => {
    const { firstName, lastName, email, age, gender, password, skills } = req.body;

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
                password: hashPassword,
                skills
            },
            omit: {
                password: true
            }
        });
        res.status(201).json({ message: "User Created Successfully", user });
    }
    catch (error: any) {
        // res.status(500).json({ message: "Internal Server Error", error: error.message })
        next(error);
    }
})

// GET /api/v1/users - Retrieve all users
route.get("/api/v1/users", authMiddleware, async (req, res, next) => {
    // we got middleware authMiddleware that checks the token and verify it
    try {
        const users = await prisma.user.findMany({});
        res.json({ message: "Users Retrieved Successfully", users });
    }
    catch (error: any) {
        next(error);
    }
})

// PATCH /api/v1/users/:id - Update a user
route.patch("/api/v1/users/:id", authMiddleware, async (req, res, next) => {
    let { id } = req.params;

    if (!Number(id)) {
        return res.status(400).json({ message: "User ID is required" });
    }

    const { firstName, lastName, email, age, gender } = req.body;
    try {
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
        res.json({ message: `${firstName} Updated Successfully`, updatedUser });
    }
    catch (error: any) {
        // res.status(500).json({ message: "Internal Server Error", error: error.message })
        next(error);
    }
})


// DELETE /api/v1/users/:id - Delete a user by ID
route.delete("/api/v1/users/:id", authMiddleware, async (req, res, next) => {
    const { id } = req.params;
    if (!Number(id)) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ message: "User Deleted Successfully" });
    } catch (error: any) {
        // res.status(500).json({ message: "Internal Server Error", error: error.message })
        next(error);
    }
})



export default route;

