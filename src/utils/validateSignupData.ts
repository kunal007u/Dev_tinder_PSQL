interface SignupData {
    firstName: string;
    email: string;
    password: string;
}

export let validateSignupData = (data: SignupData) => {
    if (!data.firstName) throw new Error("First name is Required")
    if (!data.email) throw new Error("Email is Required")
    if (!data.password) throw new Error("Password is Required")
    if (data.password.length < 6) throw new Error("Password must be at least 6 characters long")
}