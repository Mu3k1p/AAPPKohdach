import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { hapticSelect } from "../lib/telegram";

export default function Home({ data, onRefresh }) {
  const { member } = data;
  // Backend sends a `loyalty` block now. Fall back gracefully if an older
  // get-dashboard response is cached.
  const loyalty = data.loyalty ?? {};
  const tierName = loyalty.tierName ?? member.tier?.name ?? "Member";
  const percentBack = loyalty.percentBack ?? Number(member.tier?.points_per_currency_unit ?? 5);
  const creditValue = loyalty.creditValue ?? (member.pointsBalance ?? 0) / 100;

  const [refreshing, setRefreshing] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const navigate = useNavigate();
  const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "A";

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }

  function go(path) {
    hapticSelect();
    navigate(path);
  }

  return (
    <div className="px-6 pt-8 space-y-7">
      {/* Name + ID, front and center — this is who you are here */}
      <header className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amra-primary/15 border border-amra-primary/25 flex items-center justify-center overflow-hidden flex-shrink-0">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-amra-primary font-display font-semibold text-lg">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-display font-semibold truncate">
            {member.firstName || member.username || "Member"} {member.lastName || ""}
          </h1>
          <button onClick={() => setQrOpen(true)} className="font-mono text-xs text-amra-muted tracking-wider mt-0.5">
            {member.membershipCode} · {tierName}
          </button>
        </div>
      </header>

      {/* Seeds balance — the one number that matters, with what it's actually worth */}
      <div className="rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] p-5">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-amra-primary/10 text-amra-primary flex items-center justify-center text-base">
            🌱
          </div>
          <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-amra-primary">
            {tierName} · {percentBack}% back
          </p>
        </div>

        <p className="text-4xl font-display font-semibold mt-4 tracking-tight">
          {member.pointsBalance?.toLocaleString() ?? "0"}
        </p>
        <p className="text-xs text-amra-muted mt-1">Seeds</p>

        <div className="mt-3 pt-3 border-t border-amra-outline/20">
          <p className="text-sm font-display font-semibold text-amra-text">
            = ${creditValue.toFixed(2)} AMRA Credit
          </p>
          <p className="text-[11px] text-amra-muted mt-0.5">100 Seeds = $1</p>
        </div>
      </div>

      {/* Progress toward next tier — the "how much more to spend" bar */}
      {data.nextTier && (
        <div className="rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] p-4">
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm font-display font-semibold">Next: {data.nextTier.name}</p>
            <p className="text-xs text-amra-muted">
              ${Number(member.lifetimeSpend ?? 0).toFixed(0)} / ${Number(data.nextTier.min_spend).toFixed(0)}
            </p>
          </div>
          <div className="h-2 rounded-full bg-amra-surfaceDim overflow-hidden">
            <div
              className="h-full bg-amra-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (Number(member.lifetimeSpend ?? 0) / Number(data.nextTier.min_spend)) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-amra-muted mt-2">
            ${Math.max(0, Number(data.nextTier.min_spend) - Number(member.lifetimeSpend ?? 0)).toFixed(2)} more to reach {data.nextTier.name}
          </p>
          {loyalty.nextTierRate && (
            <p className="text-xs text-amra-muted mt-1">
              Reach {data.nextTier.name} to unlock {loyalty.nextTierRate}% back on every visit.
            </p>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-4">
        <p className="text-amra-muted text-xs font-display font-semibold uppercase tracking-wide">Quick actions</p>
        <div className="grid grid-cols-3 gap-3">
          <ActionTile label="Rewards" onClick={() => go("/rewards")} />
          <ActionTile label="My QR" onClick={() => setQrOpen(true)} />
          <ActionTile label="Menu" onClick={() => go("/menu")} />
        </div>
      </div>

      <button
        onClick={handleRefresh}
        disabled={refreshing}
        className="w-full text-sm text-amra-muted py-2 disabled:opacity-50 font-body"
      >
        {refreshing ? "Refreshing…" : "Tap to refresh"}
      </button>

      {qrOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setQrOpen(false)}>
          <div className="bg-amra-surface rounded-xl3 p-7 space-y-4 text-center max-w-xs w-full shadow-[0_12px_32px_-4px_rgba(30,35,29,0.2)]" onClick={(e) => e.stopPropagation()}>
            <p className="text-amra-muted text-xs uppercase tracking-wide font-display font-semibold">Membership ID</p>
            <p className="font-display text-base tracking-wider text-amra-text">{member.membershipCode}</p>
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center border border-amra-outline/30">
              <QRCodeSVG value={member.qrToken} size={200} fgColor="#171d16" bgColor="#FFFFFF" />
            </div>
            <p className="text-amra-muted text-xs">Show this to staff to verify your membership</p>
            <button onClick={() => setQrOpen(false)} className="w-full py-2.5 rounded-full bg-amra-primary text-white font-display font-medium text-sm">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionTile({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] py-4 text-center active:scale-[0.97] transition-transform"
    >
      <p className="text-sm font-display font-semibold text-amra-text">{label}</p>
    </button>
  );
}
