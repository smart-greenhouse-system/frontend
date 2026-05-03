import { Menu, Sprout } from "lucide-react";

const MobileNavbar = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-farm-green-dark transition hover:bg-farm-green-light"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-farm-green text-white">
          <Sprout className="h-4 w-4" />
        </span>
        <p className="text-sm font-semibold text-farm-green-dark">SmartGreenHouse</p>
      </div>
    </header>
  );
};

export default MobileNavbar;
