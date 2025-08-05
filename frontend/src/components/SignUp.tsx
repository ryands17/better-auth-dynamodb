import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";

export default function SignUp() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Card className="z-50 rounded-md rounded-t-none max-w-md">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    Enter your information to create an account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="first-name">First name</Label>
                            <Input
                                id="first-name"
                                placeholder="Max"
                                required
                                onChange={(e) => {
                                    setFirstName(e.target.value);
                                    if (error) setError(null);
                                }}
                                value={firstName}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="last-name">Last name</Label>
                            <Input
                                id="last-name"
                                placeholder="Robinson"
                                required
                                onChange={(e) => {
                                    setLastName(e.target.value);
                                    if (error) setError(null);
                                }}
                                value={lastName}
                            />
                        </div>
                    </div>
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
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError(null);
                            }}
                            autoComplete="new-password"
                            placeholder="Password"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Confirm Password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={passwordConfirmation}
                            onChange={(e) => {
                                setPasswordConfirmation(e.target.value);
                                if (error) setError(null);
                            }}
                            autoComplete="new-password"
                            placeholder="Confirm Password"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="image">Profile Image (optional)</Label>
                        <div className="flex items-end gap-4">
                            {imagePreview && (
                                <div className="relative w-16 h-16 rounded-sm overflow-hidden">
                                    <img
                                        src={imagePreview}
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-2 w-full">
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full"
                                />
                                {imagePreview && (
                                    <X
                                        className="cursor-pointer"
                                        onClick={() => {
                                            setImage(null);
                                            setImagePreview(null);
                                        }}
                                    />
                                )}
                            </div>
                        </div>
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

                            // Check if passwords match
                            if (password !== passwordConfirmation) {
                                setError("Passwords do not match");
                                setLoading(false);
                                return;
                            }

                            try {
                                await signUp.email(
                                    {
                                        email,
                                        password,
                                        name: `${firstName} ${lastName}`,
                                        image: image ? await convertImageToBase64(image) : undefined,
                                    },
                                    {
                                        onSuccess() {
                                            toast.success("Account created successfully!");
                                            // Navigate to dashboard - you can replace this with your routing solution
                                            window.location.href = "/dashboard";
                                        },
                                        onError(ctx) {
                                            const errorMessage = ctx.error?.message || "Failed to create account";
                                            setError(errorMessage);
                                            toast.error(errorMessage);
                                        },
                                    }
                                );
                            } catch (error: any) {
                                const errorMessage = error?.message || "An unexpected error occurred";
                                setError(errorMessage);
                                toast.error(errorMessage);
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            "Create an account"
                        )}
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

async function convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
