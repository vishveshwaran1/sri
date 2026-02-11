import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Shield, Activity } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await signIn(form.get("email") as string, form.get("password") as string);
      toast.success("Welcome back!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      await signUp(
        form.get("email") as string,
        form.get("password") as string,
        form.get("fullName") as string
      );
      toast.success("Check your email to confirm your account!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Energy</h1>
          <p className="text-muted-foreground">IoT Energy Analytics Dashboard</p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Activity className="h-3 w-3 text-primary" /> Real-time</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-energy-green" /> Theft Detection</span>
          </div>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Get Started</CardTitle>
            <CardDescription>Sign in or create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="si-pass">Password</Label>
                    <Input id="si-pass" name="password" type="password" required placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="su-name">Full Name</Label>
                    <Input id="su-name" name="fullName" required placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="su-pass">Password</Label>
                    <Input id="su-pass" name="password" type="password" required minLength={6} placeholder="••••••••" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
