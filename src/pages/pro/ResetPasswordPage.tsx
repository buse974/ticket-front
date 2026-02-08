import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/api/auth";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (error: any) {
      toast.error(error.message || "Lien invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6">
        <div className="bg-card rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold mb-2">Lien invalide</h1>
          <p className="text-muted-foreground mb-4">
            Ce lien de réinitialisation est invalide.
          </p>
          <Link
            to="/forgot-password"
            className="text-primary hover:underline font-medium"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-up">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">Q</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Q-Less
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-2xl opacity-10" />
          <div className="relative bg-card rounded-3xl p-8 shadow-xl">
            {done ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h1 className="text-2xl font-bold mb-2">
                  Mot de passe modifié
                </h1>
                <p className="text-muted-foreground mb-6">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot
                  de passe.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-gradient-primary text-white font-medium hover:opacity-90"
                >
                  Se connecter
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">
                    Nouveau mot de passe
                  </h1>
                  <p className="text-muted-foreground">
                    Choisissez votre nouveau mot de passe
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm">Confirmer</Label>
                    <Input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      minLength={6}
                      required
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-gradient-primary hover:opacity-90"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Modification...
                      </span>
                    ) : (
                      "Modifier le mot de passe"
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
