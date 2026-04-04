import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Loader2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import AuthShell from "../components/ui/AuthShell";
import { InputField } from "../components/ui/Field";
import Button from "../components/ui/Button";
import { InlineMessage } from "../components/ui/StateBlock";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Fill in your name, email, and password to create your account.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match yet.");
      return;
    }

    setLoading(true);

    try {
      await register(name.trim(), email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your study workspace"
      description="Store your material, generate AI explanations, and build quiz-ready study guides in one place."
      badge="Launch your account"
      footer={
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/sign-in" className="font-semibold text-sky-700 hover:text-sky-600 dark:text-sky-300">
            Sign in instead
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <InputField
          label="Full name"
          icon={User}
          type="text"
          placeholder="Aarav Sharma"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
        />

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
          hint="Use at least 8 characters so your study history stays protected."
          icon={Lock}
          type="password"
          placeholder="Create a secure password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />

        <InputField
          label="Confirm password"
          icon={Check}
          type="password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          error={passwordMismatch ? "Passwords do not match." : ""}
          required
        />

        <AnimatePresence>{error ? <InlineMessage message={error} tone="error" /> : null}</AnimatePresence>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating your account
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
