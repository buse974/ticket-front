import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-violet-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-fuchsia-600/20 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      ></div>

      {/* Header - Floating pill style */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
        <nav className="flex items-center gap-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-2xl shadow-black/20">
          <Link to="/" className="flex items-center gap-2 pl-3 pr-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur-sm"></div>
              <div className="relative w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
                <span className="font-black text-sm">Q</span>
              </div>
            </div>
            <span className="font-bold text-lg">Q-Less</span>
          </Link>
          <div className="h-6 w-px bg-white/10"></div>
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Connexion
          </Link>
          <Link to="/register">
            <Button
              size="sm"
              className="rounded-full bg-white text-black hover:bg-white/90 font-medium px-5"
            >
              Essai gratuit
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative pt-40 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 px-4 py-2 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-white/70">
                La file d'attente nouvelle génération
              </span>
            </div>
          </div>

          {/* Main headline */}
          <div
            className="text-center mb-8 animate-slide-up"
            style={{ animationDelay: "100ms" }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9]">
              <span className="block text-white/90">L'attente,</span>
              <span className="block mt-2 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                libérée.
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <p
            className="text-center text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-12 animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            Vos clients scannent, partent, et reviennent pile au bon moment.
            Plus de files. Plus de frustration. Juste du flow.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-20 animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <Link to="/register">
              <Button
                size="lg"
                className="relative group rounded-full px-8 py-6 text-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 shadow-lg shadow-violet-500/25"
              >
                <span className="relative z-10">Démarrer gratuitement</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </Button>
            </Link>
            <Link to="/queue/1">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-lg bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white"
              >
                <span className="mr-2">▶</span> Voir la démo
              </Button>
            </Link>
          </div>

          {/* Phone Mockup */}
          <div
            className="relative max-w-xs mx-auto animate-slide-up"
            style={{ animationDelay: "400ms" }}
          >
            {/* Glow effects */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[3rem] blur-2xl opacity-30"></div>
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-[2.8rem] opacity-50"></div>

            {/* Phone frame */}
            <div className="relative bg-[#1a1a24] rounded-[2.5rem] p-2 shadow-2xl">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a24] rounded-b-2xl z-10"></div>

              {/* Screen */}
              <div className="bg-[#0f0f15] rounded-[2rem] overflow-hidden">
                <div className="p-6 pt-10">
                  {/* Mini header */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-md flex items-center justify-center">
                      <span className="font-bold text-[10px]">Q</span>
                    </div>
                    <span className="font-semibold text-sm text-white/70">
                      Cabinet Demo
                    </span>
                  </div>

                  {/* Current number */}
                  <div className="text-center mb-6">
                    <p className="text-white/40 text-xs mb-1">
                      Numéro en cours
                    </p>
                    <div className="text-6xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      42
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-white">7</div>
                      <div className="text-[10px] text-white/40">
                        en attente
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-white">43</div>
                      <div className="text-[10px] text-white/40">prochain</div>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl p-3 text-center">
                    <span className="text-sm font-medium">
                      Prendre un ticket
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-32 mb-20">
            {[
              {
                icon: "⚡",
                title: "2 secondes",
                description: "Pour prendre un ticket. Scan, tap, done.",
              },
              {
                icon: "🔔",
                title: "Notifications",
                description: "Push automatique quand le tour approche.",
              },
              {
                icon: "📊",
                title: "Temps réel",
                description: "Tout se synchronise instantanément.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative animate-slide-up"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-white/50 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div
            className="text-center animate-slide-up"
            style={{ animationDelay: "800ms" }}
          >
            <p className="text-white/40 text-sm mb-4">
              Rejoignez les professionnels qui ont dit adieu aux files d'attente
            </p>
            <Link to="/register">
              <Button className="rounded-full px-8 py-6 text-lg bg-white text-black hover:bg-white/90 font-medium">
                Commencer maintenant — C'est gratuit
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-md flex items-center justify-center">
              <span className="font-bold text-xs">Q</span>
            </div>
            <span className="font-semibold text-white/70">Q-Less</span>
          </div>
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} Q-Less. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
