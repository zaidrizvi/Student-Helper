import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AuthShell from "../components/ui/AuthShell";
import { InputField } from "../components/ui/Field";
import Button from "../components/ui/Button";
import { InlineMessage } from "../components/ui/StateBlock";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter both your email and password to continue.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Pick up where you left off and jump straight into your notes, quizzes, and study guides."
      footer={
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          New here?{" "}
          <Link to="/sign-up" className="font-semibold text-sky-700 hover:text-sky-600 dark:text-sky-300">
            Create your free account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Email address"
          icon={Mail}
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />

        <InputField
          label="Password"
          labelRight={<span className="text-xs text-slate-400">Use the password you created at signup</span>}
          icon={Lock}
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        <AnimatePresence>{error ? <InlineMessage message={error} tone="error" /> : null}</AnimatePresence>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing you in
            </>
          ) : (
            <>
              Enter workspace
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
