import express from "express"
import { prisma } from "../config/client.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { z } from "zod";