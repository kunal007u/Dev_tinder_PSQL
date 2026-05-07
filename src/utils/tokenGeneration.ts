import jwt from 'jsonwebtoken';

// This function generates a JSON Web Token (JWT) for a given payload, which typically contains user information. The token is signed using a secret key and has an expiration time of 1 hour. This token can be used for authentication and maintaining user sessions in a web application.

export let jwtTokenGeneration = (payload: object) => {
    const secretKey = process.env.JWT_SECRET_KEY as string;
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' });
    return token;
}