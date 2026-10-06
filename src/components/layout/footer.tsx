import { useSettings } from "@/hooks/use-settings";
import { Facebook, Instagram, Linkedin, Youtube, ShieldCheck, Lock, BadgeCheck, HelpCircle, Store, Map, Umbrella, Ticket } from "lucide-react";

export function Footer() {
  const settings = useSettings();
  const name = settings?.platform_name ?? "Billetterie Afrique";

  return (
    <footer className="bg-white text-foreground mt-16 border-t border-border">
      {/* Top columns */}
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-5">
        <div>
          <div className="font-display font-extrabold text-2xl text-foreground">
            {name}<sup className="text-[10px] ml-0.5">®</sup>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Suivez-nous</div>
          <div className="mt-2 flex gap-3 text-foreground">
            <Facebook className="h-4 w-4" />
            <Instagram className="h-4 w-4" />
            <Linkedin className="h-4 w-4" />
            <Youtube className="h-4 w-4" />
          </div>
        </div>
        <div>
          <h4 className="text-foreground text-sm font-bold mb-3">Engagement qualité</h4>
          <ul className="space-y-2 text-sm text-foreground">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Paiement sécurisé</li>
            <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Paiement 100% sécurisé</li>
            <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Avis Vérifiés</li>
          </ul>
        </div>
        <div>
          <h4 className="text-foreground text-sm font-bold mb-3">{name} et vous</h4>
          <ul className="space-y-2 text-sm text-foreground">
            <li>Votre compte / Vos commandes</li>
            <li>Vos alertes et newsletters</li>
            <li>Aide / FAQ / Contact{settings?.contact_email ? ` — ${settings.contact_email}` : ""}</li>
            <li>Artistes & Salles</li>
          </ul>
        </div>
        <div>
          <h4 className="text-foreground text-sm font-bold mb-3">Les services</h4>
          <ul className="space-y-2 text-sm text-foreground">
            <li>Retrait en magasin</li>
            <li>Cartes cadeau</li>
            <li>Revente entre fans</li>
            <li>Assurance annulation</li>
          </ul>
        </div>
        <div>
          <div className="font-display font-extrabold text-xl text-foreground">{name}<sup className="text-[10px]">®</sup> <span className="italic text-base font-normal">pro</span></div>
          <ul className="mt-3 space-y-2 text-sm text-foreground">
            <li>Accès Organisateur</li>
            <li>Référencer votre événement</li>
            <li>Affiliés</li>
            <li>Devenir annonceur</li>
            <li>Qui sommes-nous ?</li>
          </ul>
        </div>
      </div>

      {/* Icon strip */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {[
            { Icon: HelpCircle, t: "Aide / FAQ / Contact", s: "Trouvez immédiatement des réponses à vos questions" },
            { Icon: Store, t: "Retrait en magasin", s: "Retirez gratuitement vos billets dans nos points de vente" },
            { Icon: Map, t: "Choix de vos places", s: "Réservez la place qui vous convient le mieux" },
            { Icon: Umbrella, t: "Assurance annulation", s: "Réservez vos billets en toute confiance et sérénité" },
            { Icon: Ticket, t: "Billet numérique", s: "Recevez votre billet directement sur votre téléphone" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex flex-col items-center gap-2">
              <Icon className="h-8 w-8 text-foreground" />
              <div className="text-sm font-bold">{t}</div>
              <div className="text-xs text-muted-foreground max-w-[180px]">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom legal bar */}
      <div className="bg-[#f5f5f5] border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-foreground">
          <span>Conditions générales de vente</span>
          <span>•</span>
          <span>Politique de confidentialité</span>
          <span>•</span>
          <span>Cookies</span>
          <span>•</span>
          <span>Mentions légales</span>
          <span>•</span>
          <span>Aide / FAQ / Contact</span>
          <span className="w-full text-center mt-1 text-muted-foreground">© {new Date().getFullYear()} {name}. Tous droits réservés.</span>
        </div>
      </div>
    </footer>
  );
}
