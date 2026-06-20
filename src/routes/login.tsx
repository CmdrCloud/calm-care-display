import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { api } from "@/shared/api/client";
import { Pill, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

export function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (api.isAuthenticated()) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        setError("Please fill in all required fields.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    } else {
      if (!email || !password) {
        setError("Please fill in all fields.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const data = await api.post<{
          accessToken: string;
          refreshToken: string;
          familyId?: string;
          user: { id: string; email: string; firstName: string; lastName: string };
        }>("/auth/register", {
          firstName,
          lastName,
          email,
          password,
          phone: phone || undefined,
        });

        api.setTokens(data.accessToken, data.refreshToken, data.familyId);
        toast.success(`Welcome to CareCircle, ${data.user.firstName}!`);
      } else {
        const data = await api.post<{
          accessToken: string;
          refreshToken: string;
          familyId?: string;
          user: { id: string; email: string; firstName: string; lastName: string };
        }>("/auth/login", { email, password });

        api.setTokens(data.accessToken, data.refreshToken, data.familyId);
        toast.success(`Welcome back, ${data.user.firstName}!`);
      }

      // Redirect to dashboard
      navigate({ to: "/" });
    } catch (err: any) {
      console.error(err);
      setError(err.message || (isSignUp ? "Registration failed." : "Invalid email or password."));
      toast.error(isSignUp ? "Registration failed." : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 px-4">
      <Card className="w-full max-w-md rounded-3xl border-primary/10 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Pill className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? "Create Account" : "CareCircle AI"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Fill in the details below to set up your profile and care circle"
              : "Enter your credentials to access your caregiver console"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Maria"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Lopez"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-9821"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="maria@carecircle.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-xs font-semibold text-primary hover:text-primary/80"
              onClick={toggleMode}
            >
              {isSignUp ? "Already have an account? Sign In" : "New to CareCircle? Create an Account"}
            </Button>
            {!isSignUp && (
              <div className="text-center text-xs text-muted-foreground mt-2">
                Demo Credentials:{" "}
                <span className="font-medium text-foreground">maria@carecircle.app</span> /{" "}
                <span className="font-medium text-foreground">password123</span>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
