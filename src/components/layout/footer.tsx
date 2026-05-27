import { useSettings } from "@/hooks/use-settings";

export function Footer() {
  const settings = useSettings();
  return (
    <footer className="bg-navbar text-white/70 mt-16">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-4">
        <div>
          <div className="text-white font-display font-extrabold text-xl">
            {settings?.platform_name ?? "Tiketsmaster"}
          </div>
          <p className="mt-2 text-sm">{settings?.tagline}</p>
        </div>
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-wide mb-3">Help</h4>
          <ul className="space-y-2 text-sm">
            <li>FAQ</li>
            <li>Contact: {settings?.contact_email ?? "—"}</li>
            <li>Refund policy</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-wide mb-3">Categories</h4>
          <ul className="space-y-2 text-sm">
            <li>Concerts</li>
            <li>Sports</li>
            <li>Arts & Theater</li>
            <li>Family</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-bold uppercase tracking-wide mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>Terms</li>
            <li>Privacy</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} {settings?.platform_name ?? "Tiketsmaster"}. All rights reserved.
      </div>
    </footer>
  );
}
