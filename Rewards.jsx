import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { redeemReward } from "../lib/api";
import { hapticSuccess } from "../lib/telegram";

export default function Rewards({ data, onRefresh }) {
  const { member, rewards } = data;
  const loyalty = data.loyalty ?? {};
  const tierName = loyalty.tierName ?? member.tier?.name ?? "Member";
  const percentBack = loyalty.percentBack ?? Number(member.tier?.points_per_currency_unit ?? 5);
  const creditValue = loyalty.creditValue ?? (member.pointsBalance ?? 0) / 100;

  const [redeeming, setRedeeming] = useState(null);
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState(null);

  async function handleRedeem(reward) {
    setError("");
    setRedeeming(reward.id);
    try {
      const result = await redeemReward(reward.id);
      setClaimed({ ...result, rewardName: reward.name });
      hapticSuccess();
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setRedeeming(null);
    }
  }

  return (
    <div className="px-5 pt-6 space-y-4">
      <header>
        <p className="text-amra-secondary text-[11px] font-display font-bold tracking-[0.08em] uppercase">Redeem Botanicals</p>
        <h1 className="text-2xl font-display font-semibold mt-1">Available Rewards</h1>
        <p className="text-amra-muted text-sm mt-1">
          Seed balance: <span className="text-amra-primary font-display font-semibold">{member.pointsBalance?.toLocaleString() ?? 0}</span>
          <span className="text-amra-muted"> · ${creditValue.toFixed(2)} credit</span>
        </p>
        <p className="text-amra-muted text-xs mt-1">
          {tierName} earns {percentBack} seeds per $1 · 100 seeds = $1
        </p>
      </header>

      {error && (
        <div className="rounded-xl2 bg-amra-secondary/10 border border-amra-secondary/30 p-3 text-sm text-amra-secondary">{error}</div>
      )}

      {rewards.length === 0 ? (
        <EmptyState text="No rewards are available right now. Check back soon." />
      ) : (
        <div className="space-y-3">
          {rewards.map((reward) => {
            const affordable = member.pointsBalance >= reward.points_required;
            const isRedeeming = redeeming === reward.id;
            const shortBy = Math.max(0, reward.points_required - (member.pointsBalance ?? 0));
            return (
              <div key={reward.id} className="rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] p-4 flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-amra-surfaceDim flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {reward.image_url ? (
                    <img src={reward.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg">🌿</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-amra-text truncate">{reward.name}</p>
                  {reward.description && (
                    <p className="text-amra-muted text-xs mt-0.5 line-clamp-2">{reward.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-amra-secondary text-sm font-display font-semibold">
                      {reward.points_required} seeds
                      <span className="text-amra-muted font-normal"> · ${(reward.points_required / 100).toFixed(2)}</span>
                    </span>
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!affordable || isRedeeming}
                      className={`text-xs px-3 py-1.5 rounded-full font-display font-medium ${
                        affordable && !isRedeeming
                          ? "bg-amra-primary text-white"
                          : "bg-amra-surfaceDim text-amra-muted cursor-not-allowed"
                      }`}
                    >
                      {isRedeeming ? "Redeeming…" : "Redeem"}
                    </button>
                  </div>
                  {!affordable && (
                    <p className="text-amra-muted text-[11px] mt-1.5">{shortBy.toLocaleString()} more seeds needed</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {claimed && <RedeemedModal claimed={claimed} onClose={() => setClaimed(null)} />}
    </div>
  );
}

function RedeemedModal({ claimed, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="relative bg-amra-surface rounded-t-3xl w-full max-w-md p-6 space-y-4 text-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Confetti />
        <p className="text-amra-primary text-sm font-display font-semibold">Reward redeemed 🌿</p>
        <h2 className="text-lg font-display font-semibold">{claimed.rewardName}</h2>
        <div className="bg-white rounded-2xl p-4 flex items-center justify-center mx-auto w-fit border border-amra-outline/30">
          <QRCodeSVG value={claimed.qrToken} size={160} fgColor="#171d16" bgColor="#FFFFFF" />
        </div>
        <p className="font-display text-sm tracking-wider">{claimed.redemptionCode}</p>
        <p className="text-amra-muted text-xs">Present this to the barista at the counter</p>
        <button onClick={onClose} className="w-full py-2.5 rounded-full bg-amra-primary text-white font-display font-medium text-sm">
          Done
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 20 }, (_, i) => i);
  const colors = ["#768A6F", "#C47F57", "#D9A05B", "#5A3E36"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.3;
        const duration = 1.4 + Math.random() * 1.1;
        const size = 6 + Math.random() * 5;
        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm animate-confetti-fall"
            style={{
              left: `${left}%`, width: size, height: size * 0.6,
              backgroundColor: colors[i % colors.length],
              animationDelay: `${delay}s`, animationDuration: `${duration}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl2 bg-white/45 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(58,46,40,0.12)] p-8 text-center">
      <p className="text-amra-muted text-sm">{text}</p>
    </div>
  );
}
