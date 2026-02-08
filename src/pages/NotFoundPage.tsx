import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-6">
      <div className="text-center max-w-md animate-scale-in">
        <div className="text-9xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent ticket-number mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
        <p className="text-muted-foreground mb-8">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="rounded-xl bg-gradient-primary hover:opacity-90">
            <Link to="/">Retour à l'accueil</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/login">Se connecter</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
