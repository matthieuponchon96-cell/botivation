export function Header() {
  return (
    <header className="bg-sage-500 text-white py-10 px-6 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-sage-400/30 rounded-full" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-sage-600/40 rounded-full" />

      <div className="relative max-w-5xl mx-auto text-center">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight">
          Lettre de Motivation
        </h1>
        <p className="mt-2 text-sage-100 text-lg font-medium">
          Architecture & Urbanisme
        </p>
      </div>
    </header>
  );
}
