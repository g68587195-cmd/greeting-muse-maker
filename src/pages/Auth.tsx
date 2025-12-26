import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowLeft, Eye, EyeOff, Home, Users, FileText, TrendingUp, Shield, BarChart3, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("reset-email") as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email!");
      setShowForgotPassword(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in successfully!");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  const features = [
    { icon: Building2, text: "Property Management" },
    { icon: Users, text: "Client & Lead Tracking" },
    { icon: FileText, text: "Quotations & Invoices" },
    { icon: BarChart3, text: "Analytics & Reports" },
  ];

  if (showForgotPassword) {
    return (
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              <circle cx="200" cy="150" r="80" fill="none" stroke="white" strokeWidth="2"/>
              <rect x="160" y="200" width="80" height="100" fill="none" stroke="white" strokeWidth="2"/>
              <polygon points="200,120 240,180 160,180" fill="none" stroke="white" strokeWidth="2"/>
            </svg>
          </div>
          <div className="relative z-10 flex flex-col justify-center p-12 text-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-3 rounded-xl">
                <Building2 className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold">Eduvanca Realestates</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">Reset Your Password</h2>
            <p className="text-lg text-white/80">Enter your email to receive a password reset link.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 bg-background">
          <Card className="w-full max-w-md shadow-xl border-0">
            <CardHeader className="space-y-4">
              <Button
                variant="ghost"
                className="w-fit"
                onClick={() => setShowForgotPassword(false)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
              <div className="text-center">
                <div className="lg:hidden mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                <CardDescription>Enter your email to receive a reset link</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    name="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        {/* SVG Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 800 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {/* Buildings */}
            <rect x="100" y="400" width="60" height="200" fill="white" opacity="0.3"/>
            <rect x="170" y="350" width="50" height="250" fill="white" opacity="0.25"/>
            <rect x="230" y="420" width="70" height="180" fill="white" opacity="0.35"/>
            <rect x="310" y="300" width="55" height="300" fill="white" opacity="0.3"/>
            <rect x="375" y="380" width="65" height="220" fill="white" opacity="0.28"/>
            <rect x="450" y="340" width="50" height="260" fill="white" opacity="0.32"/>
            <rect x="510" y="400" width="60" height="200" fill="white" opacity="0.25"/>
            <rect x="580" y="360" width="70" height="240" fill="white" opacity="0.3"/>
            <rect x="660" y="420" width="55" height="180" fill="white" opacity="0.28"/>
            {/* House Icon */}
            <g transform="translate(350, 120)">
              <polygon points="50,0 100,40 100,100 0,100 0,40" fill="none" stroke="white" strokeWidth="3"/>
              <rect x="35" y="60" width="30" height="40" fill="none" stroke="white" strokeWidth="2"/>
              <circle cx="50" cy="25" r="8" fill="none" stroke="white" strokeWidth="2"/>
            </g>
            {/* Graph/Chart */}
            <g transform="translate(550, 150)">
              <polyline points="0,80 30,50 60,65 90,30 120,45" fill="none" stroke="white" strokeWidth="3"/>
              <circle cx="0" cy="80" r="5" fill="white"/>
              <circle cx="30" cy="50" r="5" fill="white"/>
              <circle cx="60" cy="65" r="5" fill="white"/>
              <circle cx="90" cy="30" r="5" fill="white"/>
              <circle cx="120" cy="45" r="5" fill="white"/>
            </g>
            {/* Location Pin */}
            <g transform="translate(150, 180)">
              <path d="M30,0 C46,0 60,14 60,30 C60,52 30,80 30,80 C30,80 0,52 0,30 C0,14 14,0 30,0" fill="none" stroke="white" strokeWidth="3"/>
              <circle cx="30" cy="30" r="10" fill="none" stroke="white" strokeWidth="2"/>
            </g>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Building2 className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Eduvanca Realestates</h1>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Complete Real Estate<br />Management Solution
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-md">
            Streamline your property business with our comprehensive platform for managing properties, clients, sales, and more.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <feature.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center gap-6 text-white/70">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Trusted by 500+ Users</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardHeader className="space-y-4 text-center">
            <div className="lg:hidden mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
              <Building2 className="h-9 w-9 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>Sign in to access your dashboard</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  name="signin-email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signin-password">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs text-primary"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="signin-password"
                    name="signin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Mobile Features */}
            <div className="lg:hidden mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground text-center mb-4">What you can do:</p>
              <div className="grid grid-cols-2 gap-2">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <feature.icon className="h-3.5 w-3.5 text-primary" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
