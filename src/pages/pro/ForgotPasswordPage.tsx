import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/api/auth";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

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
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✉️</span>
                </div>
                <h1 className="text-2xl font-bold mb-2">Email envoyé</h1>
                <p className="text-muted-foreground mb-6">
                  Si un compte existe avec l'adresse <strong>{email}</strong>,
                  vous recevrez un lien de réinitialisation.
                </p>
                <Link
                  to="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold mb-2">
                    Mot de passe oublié
                  </h1>
                  <p className="text-muted-foreground">
                    Entrez votre email pour recevoir un lien de réinitialisation
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="pro@exemple.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        Envoi...
                      </span>
                    ) : (
                      "Envoyer le lien"
                    )}
                  </Button>
                </form>
                <div className="mt-6 text-center">
                  <Link
                    to="/login"
                    className="text-muted-foreground text-sm hover:text-primary"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
