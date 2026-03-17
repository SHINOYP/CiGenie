import { useState } from "react";
import { registerUser, loginUser } from "../services/api";

export default function Login() {

const [mode,setMode] = useState("login");
const [email,setEmail] = useState("");
const [password,setPassword] = useState("");
const [error,setError] = useState("");

const handleAuth = async () => {
    setError("");

    if (mode === "register") {
        try {
            await registerUser(email, password);
            alert("Registration successful");
            setMode("login");
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Registration failed");
        }
        return;
    }

    try {
        const res = await loginUser(email, password);
        localStorage.setItem("token", res.token);
        localStorage.setItem("loggedInUser", res.email);
        window.location.href = "/";
    } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Invalid email or password");
    }
};

return (

<div className="flex items-center justify-center h-screen bg-gray-900">

<div className="bg-gray-800 p-8 rounded-lg w-80">

<h2 className="text-white text-2xl mb-4">
{mode === "login" ? "Login" : "Register"}
</h2>

<input
className="w-full p-2 mb-3 rounded"
type="email"
placeholder="Email"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
  className="w-full p-2 mb-3 rounded"
  type="password"
  placeholder="Password"
  value={password}                // ← bind the state
  onChange={e => setPassword(e.target.value)}
/>

<button
className="w-full bg-blue-500 p-2 rounded text-white"
onClick={handleAuth}
>
{mode === "login" ? "Login" : "Register"}
</button>

<p
className="text-blue-400 mt-3 cursor-pointer"
onClick={()=>setMode(mode==="login"?"register":"login")}
>

{mode==="login"
? "New user? Register"
: "Already have account? Login"}

</p>

<p className="text-red-400 mt-2">{error}</p>

</div>

</div>

);

}