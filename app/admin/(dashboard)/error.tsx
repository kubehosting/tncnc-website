"use client";

export default function AdminError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-navy">Dashboard could not load</h2>
      <p className="mt-2 text-sm text-slate-600">
        The admin database may still be starting. Wait a few seconds and try again.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-4 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-navy hover:bg-gold-hover"
      >
        Try again
      </button>
    </div>
  );
}
