import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
      <Card className="max-w-md rounded-none">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  value={email}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </a>
              </div>

              <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  autoComplete="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                  id="remember"
                  onClick={() => {
                    setRememberMe(!rememberMe);
                  }}
              />
              <Label htmlFor="remember">Remember me</Label>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
                type="submit"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);

                  try {
                    await signIn.email(
                        { email, password, rememberMe },
                        {
                          onSuccess() {
                            // Navigate to dashboard - you can replace this with your routing solution
                            window.location.href = "/dashboard";
                          },
                          onError(ctx) {
                            const errorMessage = ctx.error?.message || "Login failed";
                            setError(errorMessage);
                          },
                        },
                    );
                  } catch (error: any) {
                    // Handle network errors or other exceptions
                    const errorMessage = error?.message || "An unexpected error occurred";
                    setError(errorMessage);
                  } finally {
                    setLoading(false);
                  }
                }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Login"}
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex justify-center w-full border-t pt-4">
            <p className="text-center text-xs text-neutral-500">
              built with{" "}
              <a
                  href="https://better-auth.com"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
              >
							<span className="dark:text-white/70 cursor-pointer">
								better-auth.
							</span>
              </a>
            </p>
          </div>
        </CardFooter>
      </Card>
  );
}
