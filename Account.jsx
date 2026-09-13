import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBackgrounds, setBackground } from "../lib/api";

export default function Account({ data, onRefresh }) {
  const { member } = data;
  const loyalty = data.loyalty ?? {};
  const tierName = loyalty.tierName ?? member.tier?.name ?? "—";
  const percentBack = loyalty.percentBack ?? Number(member.tier?.points_per_currency_unit ?? 5);
  const creditValue = loyalty.creditValue ?? (member.pointsBalance ?? 0) / 100;

  const navigate = useNavigate();
  const [backgrounds, setBackgrounds] = useState([]);
  const [applying, setApplying] = useState(null);

  useEffect(() => {
    getBackgrounds().then(setBackgrounds).catch(() => {});
  }, []);

  async function pick(url) {
    setApplying(url ?? "none");
    try {
      await setBackground(url);
      await onRefresh();
    } finally {
      setApplying(null);
    }
  }

  const rows = [
    { label: "Full name", value: [member.firstName, member.lastName].filter(Boolean).join(" ") || "—" },
    { label: "Telegram username", value: member.username ? `@${member.username}` : "—" },
    { label: "Membership ID", value: member.membershipCode },
    { label: "Membership tier", value: tierName },
    { label: "Earn rate", value: `${percentBack} seeds per $1` },
    { label: "Seed balance", value: `${member.pointsBalance?.toLocaleString() ?? 0} · $${creditValue.toFixed(2)}` },
    { label: "Lifetime spend", value: `$${Number(member.lifetimeSpend ?? 0).toFixed(2)}` },
    { label: "Status", value: member.status, capitalize: true },
    { label: "Member since", value: formatDate(member.createdAt) },
  ];

  return (
    <div className="px-5 pt-6 space-y-4">
      <header>
        <p className="text-amra-secondary text-[11px] font-display font-bold tracking-[0.08em] uppercase">Your Profile</p>
        <h1 className="text-2xl font-display font-semibold mt-1">Account</h1>
      </header>
      <div className="rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] divide-y divide-white/40">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-3.5">
            <span className="text-amra-muted text-sm">{row.label}</span>
            <span className={`text-sm font-display font-medium ${row.capitalize ? "capitalize" : ""}`}>{row.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/settings")}
        className="w-full rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] px-4 py-3.5 flex items-center justify-between"
      >
        <span className="text-sm font-display font-semibold">Settings</span>
        <span className="text-amra-muted text-sm">→</span>
      </button>

      {backgrounds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🌿</span>
            <p className="text-amra-muted text-xs font-display font-semibold uppercase tracking-wide">Choose your backdrop</p>
          </div>
          <p className="text-amra-muted text-xs -mt-1.5">A little personal touch for your app, pick what feels like home.</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => pick(null)}
              className={`group rounded-3xl h-20 bg-gradient-to-br from-amra-surfaceDim to-amra-outline/20 flex flex-col items-center justify-center gap-1 transition-all duration-300 active:scale-95 ${
                !member.backgroundUrl ? "ring-2 ring-amra-primary shadow-md shadow-amra-primary/20" : "ring-1 ring-amra-outline/30"
              }`}
            >
              <span className="text-lg">{applying === "none" ? "🌱" : "🥥"}</span>
              <span className="text-[10px] font-display font-medium text-amra-muted">{applying === "none" ? "…" : "Default"}</span>
            </button>
            {backgrounds.map((bg) => {
              const active = member.backgroundUrl === bg.image_url;
              return (
                <button
                  key={bg.id}
                  onClick={() => pick(bg.image_url)}
                  className={`relative rounded-3xl h-20 overflow-hidden transition-all duration-300 active:scale-95 ${
                    active ? "ring-2 ring-amra-primary shadow-md shadow-amra-primary/20" : "ring-1 ring-amra-outline/30"
                  }`}
                >
                  <img src={bg.image_url} alt={bg.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amra-primary text-white text-[10px] flex items-center justify-center shadow-sm">✓</span>
                  )}
                  {applying === bg.image_url && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs backdrop-blur-[1px]">…</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/history")}
        className="w-full rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] px-4 py-3.5 flex items-center justify-between"
      >
        <span className="text-sm font-display font-semibold">Transaction & Voucher History</span>
        <span className="text-amra-muted text-sm">→</span>
      </button>

    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
