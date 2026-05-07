import jwt from 'jsonwebtoken';

// This middleware function checks for the presence of a JWT token in the cookies of the incoming request. If the token is not present, it responds with a 401 Unauthorized status. If the token is present, it verifies the token using the secret key. If the token is valid, it attaches the decoded user information to the request object and calls the next middleware or route handler. If the token is invalid, it responds with a 401 Unauthorized status.

export const authMiddleware = (req: any, res: any, next: any) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized Access" });
    }

    try {
        const secretKey = process.env.JWT_SECRET_KEY as string;
        const decoded = jwt.verify(token, secretKey);
        req.user = decoded; // Attach the decoded user information to the request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).json({ message: "Invalid Token" });
    }
}