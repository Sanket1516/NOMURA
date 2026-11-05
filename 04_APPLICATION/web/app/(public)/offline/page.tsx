export const metadata = { title: "Offline" };
export default function Offline() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="font-display text-4xl">You are offline</h1>
      <p className="mt-3 text-ink-2">VAAKYA needs a connection for your data and the AI agents. Your accessibility settings still work. Try again when you are back online.</p>
    </div>
  );
}
