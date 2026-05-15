// loggedInUser = logged -in user(person sending request)
// randomPerson = random person(receiving request)

import exprees from "express";
import { prisma } from "../config/client.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import type { RequestStatus } from "../../generated/prisma/enums.ts";
import { z } from "zod";

const route = exprees.Router();

// zod 
const reviewRequestSchema = z.object({
    status: z.enum(["accepted", "rejected"]),
})

const sendRequestSchema = z.object({
    status: z.enum(["interested", "ignore"]),
    randomPersonId: z.string(),
})

// POST /api/v1/connection-requests - Create a new connection request
route.post("/api/v1/connection-requests/:status/:randomPersonId", authMiddleware, async (req: any, res, next) => {
    const { user } = req.user;
    const { status, randomPersonId } = req.params;

    sendRequestSchema.parse({ status, randomPersonId });

    if (user.id == parseInt(randomPersonId)) {
        return res.status(400).json({
            message: "Cannot send connection request to yourself"
        });
    }

    try {
        // Check if the from and to users exist
        const loggedInUser = await prisma.user.findUnique({ where: { id: user.id } });
        const randomPerson = await prisma.user.findUnique({ where: { id: parseInt(randomPersonId) } });

        if (!loggedInUser || !randomPerson) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Check if a connection request already exists between the users
        const existingRequest = await prisma.connectionRequestSchema.findFirst({
            where: {
                OR: [
                    { loggedInUserId: loggedInUser.id, randomPersonId: randomPerson.id },
                    { loggedInUserId: randomPerson.id, randomPersonId: loggedInUser.id }
                ]
            },
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Connection Request Already Exists" });
        }

        // Create a new connection request
        const connectionRequest = await prisma.connectionRequestSchema.create({
            data: {
                loggedInUserId: loggedInUser.id,
                randomPersonId: randomPerson.id,
                status: status as RequestStatus,
            },
        });

        res.status(201).json(connectionRequest);

    } catch (error: any) {
        next(error);
    }
});

/* -------------------------------------------------------------------------- */
/*                         GET PENDING REQUESTS                               */
/* -------------------------------------------------------------------------- */

route.get("/api/v1/pending-requests", authMiddleware, async (req: any, res) => {
    const { user } = req.user;
    try {
        const requests = await prisma.connectionRequestSchema.findMany({
            where: {
                loggedInUserId: user.id,
                status: "interested",
            },
            include: {
                randomPerson: true
            }
        })

        return res.status(200).json({
            success: true,
            count: requests.length,
            data: requests,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
})

/* -------------------------------------------------------------------------- */
/*                    ACCEPT / REJECT CONNECTION                              */
/* -------------------------------------------------------------------------- */

route.post("/api/v1/review-request/:status/:randomPersonId", authMiddleware, async (req: any, res) => {
    try {
        const { randomPersonId, status } = req.params;
        reviewRequestSchema.parse({ status });

        const { user } = req.user;

        // Find the connection request
        const connection = await prisma.connectionRequestSchema.findFirst({
            where: {
                loggedInUserId: user.id,
                randomPersonId: parseInt(randomPersonId),
                status: "interested",
            }
        })

        if (!connection) {
            return res.status(404).json({
                success: false,
                message: "Connection Request Not Found",
            });
        }

        // Update the connection request status

        const updatedConnection = await prisma.connectionRequestSchema.update({
            where: { id: connection.id },
            data: { status: status as RequestStatus },
        });

        return res.status(200).json({
            success: true,
            data: updatedConnection,
        });

    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
})

/* -------------------------------------------------------------------------- */
/*                           GET ALL CONNECTIONS                              */
/* -------------------------------------------------------------------------- */

route.get("/api/v1/connections", authMiddleware, async (req: any, res) => {
    try {
        const { user } = req.user;

        const connections = await prisma.connectionRequestSchema.findMany({
            where: {

                loggedInUserId: user.id,
                status: "accepted"

            },
            include: {
                loggedInUser: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        age: true,
                        gender: true,
                        skills: true,
                    }
                },
            }
        })

        return res.status(200).json({
            success: true,
            count: connections.length,
            data: connections,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
);
export default route;