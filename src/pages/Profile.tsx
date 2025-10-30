import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Upload, X } from "lucide-react";

export default function Profile() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyGstin, setCompanyGstin] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string>("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setEmail(profile.email || "");
      setCompanyName(profile.company_name || "");
      setCompanyAddress(profile.company_address || "");
      setCompanyPhone(profile.company_phone || "");
      setCompanyEmail(profile.company_email || "");
      setCompanyGstin(profile.company_gstin || "");
      setCompanyWebsite(profile.company_website || "");
      setCompanyLogoPreview(profile.company_logo_url || "");
    }
  }, [profile]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Logo must be less than 3MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    setCompanyLogoFile(file);
    setCompanyLogoPreview(URL.createObjectURL(file));
  };

  const removeLogo = () => {
    setCompanyLogoFile(null);
    setCompanyLogoPreview("");
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      let logoUrl = profile?.company_logo_url;
      
      // Upload logo if new file selected
      if (companyLogoFile) {
        const fileExt = companyLogoFile.name.split('.').pop();
        const fileName = `${user.id}/logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, companyLogoFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);
        
        logoUrl = publicUrl;
      }
      
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
          email: email,
          company_name: companyName,
          company_address: companyAddress,
          company_phone: companyPhone,
          company_email: companyEmail,
          company_gstin: companyGstin,
          company_website: companyWebsite,
          company_logo_url: logoUrl,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-10 w-10" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{profile?.full_name || "User"}</CardTitle>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="companyAddress">Company Address</Label>
              <Input
                id="companyAddress"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                placeholder="Enter company address"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="companyPhone">Company Phone</Label>
                <Input
                  id="companyPhone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="Enter company phone"
                />
              </div>
              <div>
                <Label htmlFor="companyEmail">Company Email</Label>
                <Input
                  id="companyEmail"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Enter company email"
                />
              </div>
            </div>
             <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="companyGstin">GSTIN</Label>
                <Input
                  id="companyGstin"
                  value={companyGstin}
                  onChange={(e) => setCompanyGstin(e.target.value)}
                  placeholder="Enter GSTIN"
                />
              </div>
              <div>
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="Enter website URL"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="companyLogo">Company Logo (Max 3MB)</Label>
              <div className="mt-2 space-y-4">
                {companyLogoPreview && (
                  <div className="relative inline-block">
                    <img src={companyLogoPreview} alt="Company Logo" className="h-24 w-24 object-contain border rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removeLogo}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label htmlFor="logo-upload" className="flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    Choose Logo
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {companyLogoFile ? companyLogoFile.name : "No file selected"}
                  </span>
                </div>
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Company Info"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quotation Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="quotationSignature">Show Signature on Quotations</Label>
              <div className="mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">Include signature line in quotation PDFs</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="quotationStamp">Show Stamp on Quotations</Label>
              <div className="mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">Include stamp placeholder in quotation PDFs</span>
                </label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              These settings control whether signature and stamp placeholders appear at the bottom of your quotation PDFs. Coming soon: Upload custom signature and stamp images.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">User ID:</span>
            <span className="font-mono text-sm">{user?.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created At:</span>
            <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
