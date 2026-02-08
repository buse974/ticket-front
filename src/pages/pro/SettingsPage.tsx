import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { updateProfile, changePassword, deleteAccount } from "@/api/auth";
import { toast } from "sonner";
import { User, Lock, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { professional, updateProfessional, logout } = useAuthStore();
  const navigate = useNavigate();

  // Profile form
  const [name, setName] = useState(professional?.name || "");
  const [email, setEmail] = useState(professional?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await updateProfile({ name, email });
      updateProfessional(updated);
      toast.success("Profil mis à jour");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Mot de passe modifié");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du changement de mot de passe");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
      navigate("/login");
      toast.success("Compte supprimé");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {/* Profile Section */}
      <div className="bg-card rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Profil</h2>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'entreprise</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-gradient-primary hover:opacity-90"
          >
            {savingProfile ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-card rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">Mot de passe</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="h-12 rounded-xl"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 rounded-xl"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl"
              minLength={6}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl bg-gradient-primary hover:opacity-90"
          >
            {savingPassword ? "Modification..." : "Changer le mot de passe"}
          </Button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-destructive/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-destructive">
            Zone danger
          </h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          La suppression de votre compte est irréversible. Toutes vos files
          d'attente, tickets et données seront définitivement supprimés.
        </p>
        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Supprimer mon compte
          </Button>
        ) : (
          <div className="space-y-4 bg-destructive/5 rounded-xl p-4">
            <p className="text-sm font-medium">
              Tapez <span className="font-bold">SUPPRIMER</span> pour confirmer
            </p>
            <Input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              placeholder="SUPPRIMER"
              className="h-12 rounded-xl"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteText("");
                }}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white"
                disabled={deleteText !== "SUPPRIMER" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
